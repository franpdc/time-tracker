"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight, FolderOpen, MoreHorizontal, X, Check, Trash2, FolderPlus, Edit2, Pencil, Folder } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";
import { formatDuration, cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Project } from "@/store/useTimerStore";

export default function ProjetosPage() {
  const { folders, projects, entries, addFolder, addProject, toggleFolder, deleteFolder, deleteProject, updateFolder, updateProject } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#64748b");

  const [addingProjectToFolderId, setAddingProjectToFolderId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#00F5FF");

  // Edit States
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingFolderName, setRenamingFolderName] = useState("");

  const colors = [
    "#00F5FF", // Cyan (Marca)
    "#3B82F6", // Blue
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#A855F7", // Purple
    "#D946EF", // Fuchsia
    "#EC4899", // Pink
    "#F43F5E", // Rose
    "#EF4444", // Red
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#EAB308", // Yellow
    "#84CC16", // Lime
    "#22C55E", // Green
    "#10B981", // Emerald
    "#14B8A6", // Teal
    "#06B6D4", // Sky
    "#64748B"  // Slate
  ];

  const ColorPickerMenu = ({ currentColor, onSelect }: { currentColor: string, onSelect: (color: string) => void }) => (
    <div className="grid grid-cols-6 gap-1.5 p-3 w-48">
      {colors.map(c => (
        <button
          key={c}
          onClick={() => onSelect(c)}
          className={`w-5 h-5 rounded-full transition-all duration-200 hover:scale-[1.15] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-1 focus-visible:ring-offset-card ${currentColor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
          style={{ backgroundColor: c }}
          aria-label={`Cor ${c}`}
        />
      ))}
    </div>
  );

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim(), newFolderColor);
      setNewFolderName("");
      setNewFolderColor(colors[0]);
      setIsAddingFolder(false);
    }
  };

  const handleAddProject = (folderId: string | null) => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectColor, folderId);
      setNewProjectName("");
      setAddingProjectToFolderId(null);
      setNewProjectColor(colors[0]);
    }
  };

  const getProjectTime = (projectId: string) => {
    const totalSecs = entries
      .filter((e) => e.projectId === projectId)
      .reduce((acc, curr) => acc + curr.duration, 0);
    return formatDuration(totalSecs);
  };

  const getFolderTotalTime = (folderId: string) => {
    const folderProjectIds = projects.filter(p => p.folderId === folderId).map(p => p.id);
    const totalSecs = entries
      .filter((e) => e.projectId && folderProjectIds.includes(e.projectId))
      .reduce((acc, curr) => acc + curr.duration, 0);
    return formatDuration(totalSecs);
  };

  const handleUpdateProject = () => {
    if (editingProject && editingProject.name.trim()) {
      updateProject(editingProject.id, {
        name: editingProject.name.trim(),
        color: editingProject.color,
        folderId: editingProject.folderId === "root" ? null : editingProject.folderId
      });
      setEditingProject(null);
    }
  };

  const handleRenameFolder = (id: string) => {
    if (renamingFolderName.trim()) {
      updateFolder(id, { name: renamingFolderName.trim() });
      setRenamingFolderId(null);
      setRenamingFolderName("");
    }
  };

  const rootProjects = projects.filter((p) => !p.folderId);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between px-4 lg:px-8 py-5 border-b border-border gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-[-0.02em]">Projetos</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize suas áreas de foco em pastas e projetos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setAddingProjectToFolderId("root");
              setNewProjectName("");
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover hover:border-cyan-glow/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">Novo projeto</span>
          </button>
          <button
            onClick={() => setIsAddingFolder(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-cyan-glow px-4 py-2 text-sm font-medium text-[#0D0D0D] hover:brightness-110 transition-all duration-200 shadow-[0_0_16px_rgba(0,245,255,0.2)]"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">Nova pasta</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
        {!mounted ? (
          <div className="max-w-3xl space-y-3">
            <div className="h-14 rounded-2xl skeleton" />
            <div className="h-14 rounded-2xl skeleton" />
            <div className="h-32 rounded-2xl skeleton" />
          </div>
        ) : (
          <div className="max-w-3xl space-y-4">
            {addingProjectToFolderId === "root" && (
              <div className="flex items-center gap-3 px-6 py-4 bg-card rounded-2xl border border-border shadow-card">
                <div className="flex items-center gap-1 mr-2 relative group">
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full border border-border"
                    style={{ backgroundColor: newProjectColor }}
                  />
                  <div className="absolute top-8 left-0 hidden group-hover:grid grid-cols-6 bg-popover border border-border rounded-xl p-2.5 gap-1.5 z-50 shadow-elevated w-48">
                    {colors.map(c => (
                      <button key={c} onClick={() => setNewProjectColor(c)} className={`w-5 h-5 rounded-full transition-all duration-200 hover:scale-[1.15] ${newProjectColor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <input
                  id="new-project-root-name"
                  name="projectName"
                  autoFocus
                  type="text"
                  placeholder="Nome do projeto..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddProject(null)}
                  className="flex-1 bg-transparent border-none text-foreground text-sm outline-none"
                />
                <button onClick={() => setAddingProjectToFolderId(null)} className="p-1.5 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
                <button onClick={() => handleAddProject(null)} className="p-1.5 text-cyan-glow">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            )}

            {rootProjects.length > 0 && (
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden mb-6">
                {rootProjects.map((project, idx) => (
                  <div
                    key={project.id}
                    className={cn(
                      "flex items-center justify-between px-6 py-3.5 hover:bg-surface-hover transition-colors duration-150 group",
                      idx < rootProjects.length - 1 && "border-b border-border/40"
                    )}
                  >
                    <div className="flex items-center gap-3 pl-2 overflow-hidden">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }} />
                      <span className="text-sm text-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">{project.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground font-medium tabular-nums">{getProjectTime(project.id)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all duration-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-elevated">
                          <DropdownMenuItem onClick={() => setEditingProject(project)} className="cursor-pointer flex items-center gap-2">
                            <Pencil className="h-3.5 w-3.5" /> Editar
                          </DropdownMenuItem>
                          <div className="h-px bg-border my-1" />
                          <div className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase">Mudar cor</div>
                          <ColorPickerMenu currentColor={project.color} onSelect={(color) => updateProject(project.id, { color })} />
                          <div className="h-px bg-border my-1" />
                          <DropdownMenuItem onClick={() => deleteProject(project.id)} className="text-destructive cursor-pointer flex items-center gap-2">
                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {isAddingFolder && (
              <div className="bg-card rounded-2xl border border-border shadow-card p-4 flex items-center gap-3">
                <div className="flex items-center gap-1 mr-2 relative group">
                  <button type="button" className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: newFolderColor }} />
                  <div className="absolute top-8 left-0 hidden group-hover:grid grid-cols-6 bg-popover border border-border rounded-xl p-2.5 gap-1.5 z-50 shadow-elevated w-48">
                    {colors.map(c => (
                      <button key={c} onClick={() => setNewFolderColor(c)} className={`w-5 h-5 rounded-full transition-all duration-200 ${newFolderColor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : ''}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <input
                  id="new-folder-name"
                  name="folderName"
                  autoFocus
                  type="text"
                  placeholder="Nome da pasta..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  className="flex-1 bg-transparent border-none text-foreground text-sm outline-none"
                />
                <button onClick={() => setIsAddingFolder(false)} className="p-1.5 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
                <button onClick={handleAddFolder} className="p-1.5 text-cyan-glow">
                  <Check className="h-4 w-4" />
                </button>
              </div>
            )}

            {folders.map((folder) => {
              const folderProjects = projects.filter((p) => p.folderId === folder.id);
              return (
                <div key={folder.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="flex w-full items-center justify-between px-6 py-4 hover:bg-surface-hover transition-colors duration-150 group">
                    <button onClick={() => toggleFolder(folder.id)} className="flex-1 flex items-center gap-3 text-left outline-none">
                      {folder.isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <FolderOpen className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
                      {renamingFolderId === folder.id ? (
                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                          <input 
                            id={`rename-folder-${folder.id}`}
                            name="renameFolderName"
                            autoFocus 
                            value={renamingFolderName} 
                            onChange={(e) => setRenamingFolderName(e.target.value)} 
                            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder(folder.id)} 
                            className="bg-accent/50 border-none text-sm font-semibold outline-none px-2 py-1 rounded-md w-full" 
                          />
                          <button onClick={() => handleRenameFolder(folder.id)} className="p-1 text-cyan-glow"><Check className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground truncate max-w-[150px] sm:max-w-[250px]">{folder.name}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider">{folderProjects.length} {folderProjects.length === 1 ? "projeto" : "projetos"}</span>
                        </div>
                      )}
                    </button>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground font-bold tabular-nums">{getFolderTotalTime(folder.id)}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all duration-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-elevated">
                          <DropdownMenuItem onClick={() => { setRenamingFolderId(folder.id); setRenamingFolderName(folder.name); }} className="cursor-pointer flex items-center gap-2"><Pencil className="h-3.5 w-3.5" /> Renomear</DropdownMenuItem>
                          <div className="h-px bg-border my-1" />
                          <div className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase">Mudar cor</div>
                          <ColorPickerMenu currentColor={folder.color} onSelect={(color) => updateFolder(folder.id, { color })} />
                          <div className="h-px bg-border my-1" />
                          <DropdownMenuItem onClick={() => deleteFolder(folder.id)} className="text-destructive cursor-pointer flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {folder.isOpen && (
                    <div className="border-t border-border/50">
                      {folderProjects.map((project, idx) => (
                        <div key={project.id} className={cn("flex items-center justify-between px-6 py-3.5 hover:bg-surface-hover transition-colors duration-150 group/project", (idx < folderProjects.length - 1 || addingProjectToFolderId === folder.id) && "border-b border-border/40")}>
                          <div className="flex items-center gap-3 pl-7">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }} />
                            <span className="text-sm text-foreground font-medium truncate max-w-[200px] sm:max-w-[300px]">{project.name}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground font-medium tabular-nums">{getProjectTime(project.id)}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger><div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover/project:opacity-100 hover:bg-accent transition-all duration-200"><MoreHorizontal className="h-4 w-4" /></div></DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-elevated">
                                <DropdownMenuItem onClick={() => setEditingProject(project)} className="cursor-pointer flex items-center gap-2"><Pencil className="h-3.5 w-3.5" /> Editar</DropdownMenuItem>
                                <div className="h-px bg-border my-1" /><div className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase">Mudar cor</div>
                                <ColorPickerMenu currentColor={project.color} onSelect={(color) => updateProject(project.id, { color })} />
                                <div className="h-px bg-border my-1" /><DropdownMenuItem onClick={() => deleteProject(project.id)} className="text-destructive cursor-pointer flex items-center gap-2"><Trash2 className="h-3.5 w-3.5" /> Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                      {addingProjectToFolderId === folder.id ? (
                        <div className="flex items-center gap-3 px-6 py-3 pl-10 border-t border-border/40 bg-surface-hover/40">
                          <input 
                            id={`new-project-folder-${folder.id}`}
                            name="folderProjectName"
                            autoFocus 
                            placeholder="Nome do projeto..." 
                            value={newProjectName} 
                            onChange={(e) => setNewProjectName(e.target.value)} 
                            onKeyDown={(e) => e.key === "Enter" && handleAddProject(folder.id)} 
                            className="flex-1 bg-transparent border-none text-foreground text-sm outline-none" 
                          />
                          <button onClick={() => setAddingProjectToFolderId(null)} className="p-1.5 text-muted-foreground"><X className="h-4 w-4" /></button>
                          <button onClick={() => handleAddProject(folder.id)} className="p-1.5 text-cyan-glow"><Check className="h-4 w-4" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setAddingProjectToFolderId(folder.id); setNewProjectName(""); }} className="flex w-full items-center gap-3 px-6 py-3 pl-[52px] text-muted-foreground/60 hover:text-cyan-glow hover:bg-surface-hover transition-colors duration-200">
                          <Plus className="h-4 w-4" /><span className="text-xs font-medium">Adicionar projeto</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {(() => {
              const unassignedEntries = entries.filter(e => !e.projectId);
              if (unassignedEntries.length === 0) return null;
              const grouped = unassignedEntries.reduce((acc, curr) => {
                const name = curr.taskName || "Sem título";
                acc[name] = (acc[name] || 0) + curr.duration;
                return acc;
              }, {} as Record<string, number>);
              const groupedList = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
              return (
                <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden mt-8">
                  <div className="flex w-full items-center justify-between px-6 py-4 bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"></span>
                      <span className="text-sm font-semibold text-foreground">Sem projeto</span>
                    </div>
                  </div>
                  <div className="border-t border-border/50">
                    {groupedList.map(([name, duration], idx) => (
                      <div key={name} className={cn("flex items-center justify-between px-6 py-3.5 hover:bg-surface-hover transition-colors duration-150 group", idx < groupedList.length - 1 && "border-b border-border/40")}>
                        <div className="flex items-center gap-3 pl-7"><span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">{name}</span></div>
                        <div className="flex items-center gap-4"><span className="text-sm text-muted-foreground font-medium tabular-nums">{formatDuration(duration)}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-xl">Editar Projeto</DialogTitle></DialogHeader>
          {editingProject && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Nome do Projeto</Label>
                <Input id="project-name" value={editingProject.name} onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })} className="bg-accent/30 border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-folder-${editingProject.id}`}>Pasta</Label>
                <Select value={editingProject.folderId || "root"} onValueChange={(value) => setEditingProject({ ...editingProject, folderId: value === "root" ? null : value })}>
                  <SelectTrigger id={`edit-folder-${editingProject.id}`} className="w-full bg-accent/30 border-border h-10 px-3">
                    <SelectValue>
                      {editingProject.folderId ? (
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4" style={{ color: folders.find(f => f.id === editingProject.folderId)?.color }} />
                          {folders.find(f => f.id === editingProject.folderId)?.name}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground"><Folder className="h-4 w-4 opacity-50" />Sem pasta</div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border shadow-elevated">
                    <SelectItem value="root"><div className="flex items-center gap-2"><Folder className="h-4 w-4 opacity-50" />Sem pasta</div></SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}><div className="flex items-center gap-2"><Folder className="h-4 w-4" style={{ color: f.color }} />{f.name}</div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label>Cor do Projeto</Label>
                <div className="grid grid-cols-6 gap-2 p-1">
                  {colors.map(c => (
                    <button key={c} onClick={() => setEditingProject({ ...editingProject, color: c })} className={cn("w-8 h-8 rounded-full transition-all duration-200 hover:scale-110", editingProject.color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card" : "border border-border")} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="ghost" onClick={() => setEditingProject(null)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleUpdateProject} className="bg-cyan-glow text-[#0D0D0D] hover:brightness-110 rounded-xl">Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
