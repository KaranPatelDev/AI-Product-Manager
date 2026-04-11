import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { CheckCircle2, Circle, Clock, Plus, Loader2, Pencil, Trash2, X, Save, GripVertical } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StartupAnalysis } from "@/lib/parse-analysis";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TaskStatus = "todo" | "in_progress" | "done";

interface TaskItem {
  id: string;
  feature_name: string;
  description: string;
  status: TaskStatus;
  priority: string;
}

interface Props {
  analysis: StartupAnalysis;
  analysisId?: string;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Circle; color: string; bg: string }> = {
  todo: { label: "To Do", icon: Circle, color: "text-muted-foreground", bg: "bg-muted/30" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/5" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/5" },
};

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`p-2 space-y-1.5 min-h-[100px] max-h-[350px] overflow-y-auto scrollbar-hide transition-colors rounded-b-xl ${isOver ? "bg-primary/5 ring-1 ring-primary/20" : ""}`}
    >
      {children}
    </div>
  );
}

function SortableTaskCard({ task, onEdit, onDelete }: { task: TaskItem; onEdit: (t: TaskItem) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, data: { status: task.status } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className="p-2.5 rounded-lg bg-background border border-border/30 space-y-1.5 cursor-default group"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <button {...attributes} {...listeners} className="p-0.5 rounded hover:bg-muted transition-colors cursor-grab active:cursor-grabbing mt-0.5 shrink-0 opacity-40 group-hover:opacity-100">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
          <p className="text-xs font-medium leading-tight truncate">{task.feature_name}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => onEdit(task)} className="p-0.5 rounded hover:bg-muted transition-colors">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-0.5 rounded hover:bg-destructive/10 transition-colors">
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-[10px] text-muted-foreground line-clamp-2 pl-5">{task.description}</p>
      )}
      <div className="pl-5">
        <Badge variant={task.priority === "must-have" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
          {task.priority}
        </Badge>
      </div>
    </motion.div>
  );
}

function TaskOverlay({ task }: { task: TaskItem }) {
  return (
    <div className="p-2.5 rounded-lg bg-background border-2 border-primary/30 shadow-lg space-y-1.5 w-64">
      <p className="text-xs font-medium leading-tight">{task.feature_name}</p>
      {task.description && <p className="text-[10px] text-muted-foreground line-clamp-2">{task.description}</p>}
      <Badge variant={task.priority === "must-have" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">{task.priority}</Badge>
    </div>
  );
}

export function ProgressTracker({ analysis, analysisId }: Props) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("nice-to-have");
  const [editTask, setEditTask] = useState<TaskItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editStatus, setEditStatus] = useState<TaskStatus>("todo");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    if (!user || !analysisId) return;
    loadTasks();
  }, [user, analysisId]);

  const loadTasks = async () => {
    if (!user || !analysisId) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("task_items").select("*").eq("analysis_id", analysisId).eq("user_id", user.id).order("created_at");
    if (!error && data && data.length > 0) {
      setTasks(data.map((d: any) => ({ id: d.id, feature_name: d.feature_name, description: d.description || "", status: d.status as TaskStatus, priority: d.priority || "nice-to-have" })));
      setInitialized(true);
    }
    setLoading(false);
  };

  const createTasksFromMvp = async () => {
    if (!analysis.mvpPlan?.features?.length) return;
    if (!user || !analysisId) {
      const localTasks: TaskItem[] = analysis.mvpPlan.features.map((f, i) => ({ id: `local-${i}`, feature_name: f.name, description: f.description, status: "todo" as TaskStatus, priority: f.priority }));
      setTasks(localTasks); setInitialized(true);
      toast.success("Tasks created locally! Sign in to save them.");
      return;
    }
    setLoading(true);
    const rows = analysis.mvpPlan.features.map((f) => ({ user_id: user.id, analysis_id: analysisId, feature_name: f.name, description: f.description, status: "todo", priority: f.priority }));
    const { error } = await (supabase as any).from("task_items").insert(rows);
    if (error) toast.error("Failed to create tasks");
    else { toast.success("Tasks created!"); await loadTasks(); }
    setLoading(false);
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    if (user && analysisId && !taskId.startsWith("local-")) {
      await (supabase as any).from("task_items").update({ status: newStatus }).eq("id", taskId);
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (user && !taskId.startsWith("local-")) {
      await (supabase as any).from("task_items").delete().eq("id", taskId);
    }
    toast.success("Task deleted");
  };

  const openEdit = (task: TaskItem) => {
    setEditTask(task);
    setEditName(task.feature_name);
    setEditDesc(task.description);
    setEditPriority(task.priority);
    setEditStatus(task.status);
  };

  const saveEdit = async () => {
    if (!editTask) return;
    setTasks((prev) => prev.map((t) => t.id === editTask.id ? { ...t, feature_name: editName, description: editDesc, priority: editPriority, status: editStatus } : t));
    if (user && !editTask.id.startsWith("local-")) {
      await (supabase as any).from("task_items").update({ feature_name: editName, description: editDesc, priority: editPriority, status: editStatus }).eq("id", editTask.id);
    }
    setEditTask(null);
    toast.success("Task updated");
  };

  const addTask = async () => {
    if (!newName.trim()) return;
    const newTask: TaskItem = { id: `local-${Date.now()}`, feature_name: newName.trim(), description: newDesc.trim(), status: "todo", priority: newPriority };
    if (user && analysisId) {
      const { data, error } = await (supabase as any).from("task_items").insert({ user_id: user.id, analysis_id: analysisId, feature_name: newTask.feature_name, description: newTask.description, status: "todo", priority: newTask.priority }).select().single();
      if (!error && data) newTask.id = data.id;
    }
    setTasks((prev) => [...prev, newTask]);
    setNewName(""); setNewDesc(""); setShowAdd(false);
    toast.success("Task added");
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => { setActiveId(event.active.id as string); };
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const overId = over.id as string;
    const isColumn = STATUS_ORDER.includes(overId as TaskStatus);
    const targetStatus = isColumn ? overId as TaskStatus : tasks.find(t => t.id === overId)?.status;
    if (!targetStatus) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (activeTask && activeTask.status !== targetStatus) {
      setTasks(prev => prev.map(t => t.id === active.id ? { ...t, status: targetStatus } : t));
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const task = tasks.find(t => t.id === active.id);
    if (task && user && !task.id.startsWith("local-")) {
      await (supabase as any).from("task_items").update({ status: task.status }).eq("id", task.id);
    }
  };

  if (!analysis.mvpPlan?.features?.length) return null;

  if (!initialized && !loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4 text-sm">Convert MVP features into trackable tasks</p>
        <Button onClick={createTasksFromMvp} size="sm" className="rounded-full"><Plus className="h-4 w-4 mr-2" /> Create Tasks</Button>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const grouped = STATUS_ORDER.map((status) => ({ status, ...STATUS_CONFIG[status], tasks: tasks.filter((t) => t.status === status) }));
  const completedCount = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0;
  const draggedTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
        <span className="text-sm font-semibold">{progress}%</span>
        <span className="text-xs text-muted-foreground">{completedCount}/{tasks.length}</span>
      </div>

      {/* Add Task */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)} className="rounded-full text-xs">
          {showAdd ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          {showAdd ? "Cancel" : "Add Task"}
        </Button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 rounded-lg border border-border/50 bg-muted/30 space-y-2">
              <Input placeholder="Task name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-sm" />
              <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="h-8 text-sm" />
              <div className="flex gap-2">
                <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} className="h-8 rounded-md border border-input bg-background px-2 text-xs flex-1">
                  <option value="must-have">Must Have</option>
                  <option value="nice-to-have">Nice to Have</option>
                </select>
                <Button size="sm" onClick={addTask} className="h-8 text-xs"><Save className="h-3 w-3 mr-1" /> Add</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban with DnD */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {grouped.map((col) => {
            const Icon = col.icon;
            return (
              <div key={col.status} className={`rounded-xl border border-border/40 overflow-hidden ${col.bg}`}>
                <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2">
                  <Icon className={`h-3.5 w-3.5 ${col.color}`} />
                  <span className="text-xs font-semibold">{col.label}</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{col.tasks.length}</Badge>
                </div>
                <DroppableColumn id={col.status}>
                  <SortableContext items={col.tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {col.tasks.map((task) => (
                      <SortableTaskCard key={task.id} task={task} onEdit={openEdit} onDelete={deleteTask} />
                    ))}
                  </SortableContext>
                  {col.tasks.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-4">Drop tasks here</p>
                  )}
                </DroppableColumn>
              </div>
            );
          })}
        </div>
        <DragOverlay>{draggedTask ? <TaskOverlay task={draggedTask} /> : null}</DragOverlay>
      </DndContext>

      {/* Edit Dialog */}
      <Dialog open={!!editTask} onOpenChange={(open) => !open && setEditTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Task Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="must-have">Must Have</SelectItem>
                    <SelectItem value="nice-to-have">Nice to Have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as TaskStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTask(null)}>Cancel</Button>
            <Button onClick={saveEdit}><Save className="h-4 w-4 mr-1" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
