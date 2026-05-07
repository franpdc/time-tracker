"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronDown, ChevronRight, FolderOpen, MoreHorizontal, X, Check, Trash2, FolderPlus } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";
import { formatDuration } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjetosPage() {
  const { folders, projects, entries, addFolder, addProject, toggleFolder, deleteFolder, deleteProject, updateFolder, updateProject } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#64748b");

  const [addingProjectToFolderId, setAddingProjectToFolderId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#00F5FF");

  const colors = [
    "#2563eb", // Blue
    "#6366f1", // Indigo
    "#7c3aed", // Violet
    "#a855f7", // Purple
    "#db2777", // Pink
    "#e11d48", // Rose
    "#dc2626", // Red
    "#ea580c", // Orange
    "#d97706", // Amber
    "#eab308", // Yellow
    "#65a30d", // Lime
    "#16a34a", // Green
    "#059669", // Emerald
    "#0d9488", // Teal
    "#334155", // Dark Slate
    "#71717a", // Mid Zinc
    "#a1a1aa", // Silver
    "#00F5FF"  // Theme Cyan
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

  const rootProjects = projects.filter((p) => !p.folderId);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
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
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-card border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-hover hover:border-cyan-glow/30 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">Novo projeto</span>
          </button>
          <button
            onClick={() => setIsAddingFolder(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl bg-cyan-glow px-4 py-2 text-sm font-medium text-[#0D0D0D] hover:brightness-110 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={{ boxShadow: "0 0 16px rgba(0, 245, 255, 0.2)" }}
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

            {/* Add Root Project Inline Input */}
            {addingProjectToFolderId === "root" && (
              <div className="flex items-center gap-3 px-6 py-4 bg-card rounded-2xl border border-border shadow-card overflow-visible">
                <div className="flex items-center gap-1 mr-2 relative group">
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full border border-border cursor-pointer transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                    style={{ backgroundColor: newProjectColor }}
                    aria-label="Mudar cor do projeto"
                  />
                  <div className="absolute top-8 left-0 hidden group-hover:grid group-focus-within:grid grid-cols-6 bg-popover border border-border rounded-xl p-2.5 gap-1.5 z-50 shadow-elevated w-48">
                    {colors.map(c => (
                      <button key={c} onClick={() => setNewProjectColor(c)} className={`w-5 h-5 rounded-full transition-all duration-200 hover:scale-[1.15] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 ${newProjectColor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : ''}`} style={{ backgroundColor: c }} aria-label={`Cor ${c}`} />
                    ))}
                  </div>
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome do projeto..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddProject(null)}
                  className="flex-1 bg-transparent border-none text-foreground text-sm outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => setAddingProjectToFolderId(null)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleAddProject(null)}
                  className="p-1.5 text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-colors duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                  aria-label="Adicionar"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Root Projects List */}
            {rootProjects.length > 0 && (
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden mb-6">
                {rootProjects.map((project, idx) => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between px-6 py-3.5 hover:bg-surface-hover transition-colors duration-150 cursor-default group ${
                      idx < rootProjects.length - 1 ? "border-b border-border/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 pl-2">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }}
                      />
                      <span className="text-sm text-foreground font-medium">
                        {project.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground font-medium tabular-nums">
                        {getProjectTime(project.id)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all duration-200 outline-none cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-glow/40">
                            <MoreHorizontal className="h-4 w-4" />
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-elevated">
                          <div className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Mudar cor</div>
                          <ColorPickerMenu currentColor={project.color} onSelect={(color) => updateProject(project.id, { color })} />
                          <div className="h-px bg-border my-1" />
                          <DropdownMenuItem
                            onClick={() => deleteProject(project.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Folder Inline Input */}
            {isAddingFolder && (
              <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden p-4 flex items-center gap-3">
                <div className="flex items-center gap-1 mr-2 relative group">
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full border border-border cursor-pointer transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                    style={{ backgroundColor: newFolderColor }}
                    aria-label="Mudar cor da pasta"
                  />
                  <div className="absolute top-8 left-0 hidden group-hover:grid group-focus-within:grid grid-cols-6 bg-popover border border-border rounded-xl p-2.5 gap-1.5 z-50 shadow-elevated w-48">
                    {colors.map(c => (
                      <button key={c} onClick={() => setNewFolderColor(c)} className={`w-5 h-5 rounded-full transition-all duration-200 hover:scale-[1.15] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 ${newFolderColor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : ''}`} style={{ backgroundColor: c }} aria-label={`Cor ${c}`} />
                    ))}
                  </div>
                </div>
                <input
                  autoFocus
                  type="text"
                  placeholder="Nome da pasta..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                  className="flex-1 bg-transparent border-none text-foreground text-sm outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={() => setIsAddingFolder(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                  aria-label="Cancelar"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleAddFolder}
                  className="p-1.5 text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-colors duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                  aria-label="Criar pasta"
                >
                  <Check className="h-4 w-4" />
                </button>
              </div>
            )}

            {folders.length === 0 && !isAddingFolder && rootProjects.length === 0 && addingProjectToFolderId !== "root" && (
              <div className="text-center py-14 border border-dashed border-border rounded-2xl bg-card/30">
                <div className="flex justify-center mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-hover">
                    <FolderPlus className="h-6 w-6 text-muted-foreground/60" strokeWidth={1.6} />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">Nada por aqui ainda</p>
                <p className="text-xs text-muted-foreground/70 mt-1 max-w-xs mx-auto">
                  Crie uma pasta para agrupar projetos, ou adicione um projeto direto.
                </p>
              </div>
            )}

            {folders.map((folder) => {
              const folderProjects = projects.filter((p) => p.folderId === folder.id);
              return (
                <div
                  key={folder.id}
                  className="bg-card rounded-2xl border border-border shadow-card overflow-hidden"
                >
                  {/* Folder header */}
                  <div className="flex w-full items-center justify-between px-6 py-4 hover:bg-surface-hover transition-colors duration-150 group">
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      className="flex-1 flex items-center gap-3 text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/40"
                    >
                      {folder.isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                      )}
                      <FolderOpen className="h-4 w-4 shrink-0" style={{ color: folder.color }} />
                      <span className="text-sm font-semibold text-foreground tracking-[-0.01em]">
                        {folder.name}
                      </span>
                      <span className="text-2xs text-muted-foreground/70 font-medium">
                        {folderProjects.length} {folderProjects.length === 1 ? "projeto" : "projetos"}
                      </span>
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-glow/40">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-elevated">
                        <div className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Mudar cor</div>
                        <ColorPickerMenu currentColor={folder.color} onSelect={(color) => updateFolder(folder.id, { color })} />
                        <div className="h-px bg-border my-1" />
                        <DropdownMenuItem
                          onClick={() => deleteFolder(folder.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Projects list */}
                  {folder.isOpen && (
                    <div className="border-t border-border/50">
                      {folderProjects.length === 0 && addingProjectToFolderId !== folder.id && (
                        <div className="px-6 py-5 text-xs text-muted-foreground/70 text-center italic">
                          Pasta vazia. Adicione um projeto abaixo.
                        </div>
                      )}
                      {folderProjects.map((project, idx) => (
                        <div
                          key={project.id}
                          className={`flex items-center justify-between px-6 py-3.5 hover:bg-surface-hover transition-colors duration-150 cursor-default group/project ${
                            idx < folderProjects.length - 1 || addingProjectToFolderId === folder.id
                              ? "border-b border-border/40"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 pl-7">
                            <span
                              className="h-3 w-3 rounded-full shrink-0"
                              style={{ backgroundColor: project.color, boxShadow: `0 0 8px ${project.color}40` }}
                            />
                            <span className="text-sm text-foreground font-medium">
                              {project.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground font-medium tabular-nums">
                              {getProjectTime(project.id)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover/project:opacity-100 hover:bg-accent hover:text-foreground transition-all duration-200 cursor-pointer focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-cyan-glow/40">
                                  <MoreHorizontal className="h-4 w-4" />
                                </div>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 bg-card border-border shadow-elevated">
                                <div className="px-2 py-1.5 text-2xs font-semibold text-muted-foreground uppercase tracking-[0.14em]">Mudar cor</div>
                                <ColorPickerMenu currentColor={project.color} onSelect={(color) => updateProject(project.id, { color })} />
                                <div className="h-px bg-border my-1" />
                                <DropdownMenuItem
                                  onClick={() => deleteProject(project.id)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}

                      {/* Add project inline input */}
                      {addingProjectToFolderId === folder.id ? (
                        <div className="flex items-center gap-3 px-6 py-3 pl-10 border-t border-border/40 bg-surface-hover/40">
                          <div className="flex items-center gap-1 mr-2 relative group">
                            <button
                              type="button"
                              className="h-4 w-4 rounded-full border border-border cursor-pointer transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                              style={{ backgroundColor: newProjectColor }}
                              aria-label="Mudar cor do projeto"
                            />
                            <div className="absolute top-8 left-0 hidden group-hover:grid group-focus-within:grid grid-cols-6 bg-popover border border-border rounded-xl p-2.5 gap-1.5 z-50 shadow-elevated w-48">
                              {colors.map(c => (
                                <button key={c} onClick={() => setNewProjectColor(c)} className={`w-5 h-5 rounded-full transition-all duration-200 hover:scale-[1.15] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50 ${newProjectColor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-popover' : ''}`} style={{ backgroundColor: c }} aria-label={`Cor ${c}`} />
                              ))}
                            </div>
                          </div>
                          <input
                            autoFocus
                            type="text"
                            placeholder="Nome do projeto..."
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddProject(folder.id)}
                            className="flex-1 bg-transparent border-none text-foreground text-sm outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted-foreground/50"
                          />
                          <button
                            onClick={() => setAddingProjectToFolderId(null)}
                            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                            aria-label="Cancelar"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAddProject(folder.id)}
                            className="p-1.5 text-cyan-glow hover:bg-cyan-glow/10 rounded-lg transition-colors duration-200 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/50"
                            aria-label="Adicionar"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingProjectToFolderId(folder.id);
                            setNewProjectName("");
                          }}
                          className="flex w-full items-center gap-3 px-6 py-3 pl-[52px] text-muted-foreground/60 hover:text-cyan-glow hover:bg-surface-hover transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/30 focus-visible:bg-surface-hover"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="text-xs font-medium">Adicionar projeto</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Unassigned Tasks List */}
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
                      <div className="h-4 w-4 flex items-center justify-center">
                        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"></span>
                      </div>
                      <span className="text-sm font-semibold text-foreground tracking-[-0.01em]">
                        Sem projeto
                      </span>
                      <span className="text-2xs text-muted-foreground/70 font-medium">
                        {groupedList.length} {groupedList.length === 1 ? "grupo" : "grupos"}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-border/50">
                    {groupedList.map(([name, duration], idx) => {
                      const formattedTime = formatDuration(duration);
                      return (
                        <div
                          key={name}
                          className={`flex items-center justify-between px-6 py-3.5 hover:bg-surface-hover transition-colors duration-150 group ${
                            idx < groupedList.length - 1 ? "border-b border-border/40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 pl-7">
                            <span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">
                              {name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground font-medium tabular-nums">
                              {formattedTime}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
