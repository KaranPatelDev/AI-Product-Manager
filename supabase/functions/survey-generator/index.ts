import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SurveyQuestion {
  id: string;
  type: string;
  question: string;
  required: boolean;
  options: string[] | null;
  scaleMin: number | null;
  scaleMax: number | null;
  scaleLabels: { min: string; max: string } | null;
}

interface SurveySection {
  title: string;
  description: string;
  questions: SurveyQuestion[];
}

interface SurveyData {
  surveyTitle: string;
  surveyDescription: string;
  estimatedTime: string;
  sections: SurveySection[];
  analysisGuide: {
    keyMetrics: string[];
    sampleSize: number;
    statisticalSignificance: string;
    interpretationTips: string[];
  };
}

async function getGoogleAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const claimSet = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/forms.body https://www.googleapis.com/auth/drive",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  }));

  // Import the private key and sign the JWT
  const pemContents = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8", binaryKey, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]
  );

  const signatureInput = new TextEncoder().encode(`${header}.${claimSet}`);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, signatureInput);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

  const jwt = `${header}.${claimSet}.${signatureB64}`;

  const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResp.ok) {
    const err = await tokenResp.text();
    throw new Error(`Google auth failed: ${err}`);
  }

  const { access_token } = await tokenResp.json();
  return access_token;
}

function mapQuestionToFormItem(q: SurveyQuestion) {
  const item: Record<string, unknown> = {
    title: q.question,
    questionItem: { question: { required: q.required } as Record<string, unknown> },
  };
  const questionObj = (item.questionItem as Record<string, unknown>).question as Record<string, unknown>;

  switch (q.type) {
    case "multiple_choice":
      questionObj.choiceQuestion = {
        type: "RADIO",
        options: (q.options || []).map((o) => ({ value: o })),
      };
      break;
    case "yes_no":
      questionObj.choiceQuestion = {
        type: "RADIO",
        options: [{ value: "Yes" }, { value: "No" }],
      };
      break;
    case "scale":
      questionObj.scaleQuestion = {
        low: q.scaleMin || 1,
        high: q.scaleMax || 10,
        lowLabel: q.scaleLabels?.min || "",
        highLabel: q.scaleLabels?.max || "",
      };
      break;
    case "ranking":
      questionObj.choiceQuestion = {
        type: "DROP_DOWN",
        options: (q.options || []).map((o) => ({ value: o })),
      };
      break;
    case "open_ended":
    default:
      questionObj.textQuestion = { paragraph: true };
      break;
  }

  return item;
}

async function createGoogleForm(accessToken: string, surveyData: SurveyData): Promise<string> {
  // Step 1: Create empty form
  const createResp = await fetch("https://forms.googleapis.com/v1/forms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      info: { title: surveyData.surveyTitle, documentTitle: surveyData.surveyTitle },
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Failed to create form: ${err}`);
  }

  const form = await createResp.json();
  const formId = form.formId;

  // Step 2: Build batch update requests to add questions
  const requests: Record<string, unknown>[] = [];

  // Update form description
  requests.push({
    updateFormInfo: {
      info: { description: surveyData.surveyDescription },
      updateMask: "description",
    },
  });

  let index = 0;
  for (const section of surveyData.sections) {
    // Add section header as a text item
    requests.push({
      createItem: {
        item: {
          title: section.title,
          description: section.description,
          textItem: {},
        },
        location: { index },
      },
    });
    index++;

    for (const q of section.questions) {
      requests.push({
        createItem: {
          item: mapQuestionToFormItem(q),
          location: { index },
        },
      });
      index++;
    }
  }

  // Step 3: Batch update
  const updateResp = await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!updateResp.ok) {
    const err = await updateResp.text();
    console.error("Batch update error:", err);
    // Form was created, return it even if some questions failed
  } else {
    await updateResp.text(); // consume
  }

  // Make form accept responses
  await fetch(`https://forms.googleapis.com/v1/forms/${formId}:batchUpdate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [{ updateSettings: { settings: { quizSettings: null }, updateMask: "*" } }],
    }),
  }).catch(() => {});

  return `https://docs.google.com/forms/d/${formId}/viewform`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { idea, analysis } = await req.json();
    if (!idea) return new Response(JSON.stringify({ error: "Idea is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const GOOGLE_SA = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

    const systemPrompt = `You are a user research expert. Generate a comprehensive user validation survey for a startup idea. Return ONLY valid JSON (no markdown):
{
  "surveyTitle": string,
  "surveyDescription": string,
  "estimatedTime": string,
  "sections": [
    {
      "title": string,
      "description": string,
      "questions": [
        {
          "id": string,
          "type": "multiple_choice"|"scale"|"open_ended"|"yes_no"|"ranking",
          "question": string,
          "required": boolean,
          "options": string[] | null,
          "scaleMin": number | null,
          "scaleMax": number | null,
          "scaleLabels": { "min": string, "max": string } | null
        }
      ]
    }
  ],
  "analysisGuide": {
    "keyMetrics": string[],
    "sampleSize": number,
    "statisticalSignificance": string,
    "interpretationTips": string[]
  }
}
Generate 15-20 high-quality questions across 4-5 sections. Include demographics, problem validation, solution feedback, pricing sensitivity, and willingness to pay.`;

    // Generate survey via AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Startup idea: ${idea}\n\nAnalysis: ${JSON.stringify(analysis || {})}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    let content = aiResult.choices?.[0]?.message?.content || "";
    content = content.trim();
    if (content.startsWith("```")) {
      content = content.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const surveyData: SurveyData = JSON.parse(content);

    // Try to create Google Form if credentials available
    let googleFormsUrl = "";
    if (GOOGLE_SA) {
      try {
        const accessToken = await getGoogleAccessToken(GOOGLE_SA);
        googleFormsUrl = await createGoogleForm(accessToken, surveyData);
        console.log("Google Form created:", googleFormsUrl);
      } catch (e) {
        console.error("Google Forms creation failed:", e);
      }
    }

    const result = { ...surveyData, googleFormsUrl };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Survey generator error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
