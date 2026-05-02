"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronRight, FolderOpen, MoreHorizontal, X, Check, Trash2 } from "lucide-react";
import { useAppStore } from "@/store/useTimerStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProjetosPage() {
  const { folders, projects, entries, addFolder, addProject, toggleFolder, deleteFolder, deleteProject, deleteEntry } = useAppStore();
  
  // State for adding folder
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // State for adding project
  const [addingProjectToFolderId, setAddingProjectToFolderId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#00F5FF");

  const colors = ["#00F5FF", "#FF6B00", "#00E676", "#A855F7", "#F43F5E", "#EAB308", "#3B82F6"];

  const handleAddFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  const handleAddProject = (folderId: string | null) => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectColor, folderId);
      setNewProjectName("");
      setAddingProjectToFolderId(null);
      // default back to cyan
      setNewProjectColor(colors[0]);
    }
  };

  const getProjectTime = (projectId: string) => {
    const totalSecs = entries
      .filter((e) => e.projectId === projectId)
      .reduce((acc, curr) => acc + curr.duration, 0);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const rootProjects = projects.filter((p) => !p.folderId);

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-[#1A1A1A]">
        <div>
          <h1 className="text-xl font-bold text-white">Projetos</h1>
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
            className="flex items-center gap-2 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] px-4 py-2 text-sm font-medium text-white hover:bg-[#242424] transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Novo projeto
          </button>
          <button
            onClick={() => setIsAddingFolder(true)}
            className="flex items-center gap-2 rounded-xl bg-cyan-glow px-4 py-2 text-sm font-medium text-[#0D0D0D] hover:bg-cyan-glow/90 transition-all duration-200 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Nova pasta
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-3xl space-y-4">
          
          {/* Add Root Project Inline Input */}
          {addingProjectToFolderId === "root" && (
            <div className="flex items-center gap-3 px-6 py-4 bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden">
               {/* Color Picker Simple */}
               <div className="flex items-center gap-1 mr-2 relative group">
                  <div className="h-4 w-4 rounded-full border border-[#333] cursor-pointer" style={{ backgroundColor: newProjectColor }}></div>
                  <div className="absolute top-6 left-0 hidden group-hover:flex bg-[#242424] border border-[#333] rounded-lg p-1.5 gap-1.5 z-10">
                     {colors.map(c => (
                       <button key={c} onClick={() => setNewProjectColor(c)} className="w-4 h-4 rounded-full hover:scale-110 transition-transform" style={{backgroundColor: c}} />
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
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0"
              />
              <button
                onClick={() => setAddingProjectToFolderId(null)}
                className="p-1.5 text-muted-foreground hover:text-white rounded-md hover:bg-[#2A2A2A]"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleAddProject(null)}
                className="p-1.5 text-cyan-glow hover:bg-cyan-glow/10 rounded-md"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Root Projects List */}
          {rootProjects.length > 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden mb-6">
              {rootProjects.map((project, idx) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between px-6 py-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer group ${
                    idx < rootProjects.length - 1 ? "border-b border-[#2A2A2A]/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 pl-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-sm text-white font-medium">
                      {project.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground font-medium tabular-nums">
                      {getProjectTime(project.id)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger>
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[#2A2A2A] hover:text-white transition-all outline-none cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32 bg-[#1A1A1A] border-[#2A2A2A]">
                        <DropdownMenuItem
                          onClick={() => deleteProject(project.id)}
                          className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
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
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden p-4 flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                placeholder="Nome da pasta..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddFolder()}
                className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0"
              />
              <button
                onClick={() => setIsAddingFolder(false)}
                className="p-1.5 text-muted-foreground hover:text-white rounded-md hover:bg-[#2A2A2A]"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                onClick={handleAddFolder}
                className="p-1.5 text-cyan-glow hover:bg-cyan-glow/10 rounded-md"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {folders.length === 0 && !isAddingFolder && rootProjects.length === 0 && addingProjectToFolderId !== "root" && (
            <div className="text-center py-12 border border-dashed border-[#2A2A2A] rounded-2xl">
              <FolderOpen className="h-10 w-10 text-[#333] mx-auto mb-3" />
              <p className="text-[#666] text-sm">Nenhuma pasta criada ainda.</p>
              <p className="text-[#444] text-xs mt-1">Crie uma pasta para organizar seus projetos.</p>
            </div>
          )}

          {folders.map((folder) => {
            const folderProjects = projects.filter((p) => p.folderId === folder.id);
            return (
              <div
                key={folder.id}
                className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden"
              >
                {/* Folder header */}
                <div className="flex w-full items-center justify-between px-6 py-4 hover:bg-[#1E1E1E] transition-colors group">
                  <button
                    onClick={() => toggleFolder(folder.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    {folder.isOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <FolderOpen className="h-5 w-5 text-orange-accent" />
                    <span className="text-sm font-semibold text-white">
                      {folder.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {folderProjects.length} projetos
                    </span>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[#2A2A2A] hover:text-white transition-colors cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32 bg-[#1A1A1A] border-[#2A2A2A]">
                      <DropdownMenuItem
                        onClick={() => deleteFolder(folder.id)}
                        className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Projects list */}
                {folder.isOpen && (
                  <div className="border-t border-[#2A2A2A]/50">
                    {folderProjects.length === 0 && addingProjectToFolderId !== folder.id && (
                       <div className="px-6 py-4 text-xs text-muted-foreground text-center">
                         Nenhum projeto nesta pasta.
                       </div>
                    )}
                    {folderProjects.map((project, idx) => (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between px-6 py-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer group/project ${
                          idx < folderProjects.length - 1 || addingProjectToFolderId === folder.id
                            ? "border-b border-[#2A2A2A]/30"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 pl-7">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-sm text-white font-medium">
                            {project.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground font-medium tabular-nums">
                            {getProjectTime(project.id)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover/project:opacity-100 hover:bg-[#2A2A2A] hover:text-white transition-all cursor-pointer">
                                <MoreHorizontal className="h-4 w-4" />
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-32 bg-[#1A1A1A] border-[#2A2A2A]">
                              <DropdownMenuItem
                                onClick={() => deleteProject(project.id)}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
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
                      <div className="flex items-center gap-3 px-6 py-3 pl-10 border-t border-[#2A2A2A]/30 bg-[#1A1A1A]/50">
                         {/* Color Picker Simple */}
                         <div className="flex items-center gap-1 mr-2 relative group">
                            <div className="h-4 w-4 rounded-full border border-[#333] cursor-pointer" style={{ backgroundColor: newProjectColor }}></div>
                            <div className="absolute top-6 left-0 hidden group-hover:flex bg-[#242424] border border-[#333] rounded-lg p-1.5 gap-1.5 z-10">
                               {colors.map(c => (
                                 <button key={c} onClick={() => setNewProjectColor(c)} className="w-4 h-4 rounded-full hover:scale-110 transition-transform" style={{backgroundColor: c}} />
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
                          className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0"
                        />
                        <button
                          onClick={() => setAddingProjectToFolderId(null)}
                          className="p-1.5 text-muted-foreground hover:text-white rounded-md hover:bg-[#2A2A2A]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAddProject(folder.id)}
                          className="p-1.5 text-cyan-glow hover:bg-cyan-glow/10 rounded-md"
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
                        className="flex w-full items-center gap-3 px-6 py-3 pl-[52px] text-[#555555] hover:text-cyan-glow hover:bg-[#1E1E1E] transition-colors"
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
          {entries.filter(e => !e.projectId).length > 0 && (
            <div className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden mt-8">
              <div className="flex w-full items-center justify-between px-6 py-4 bg-[#1E1E1E]">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 flex items-center justify-center">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#555555]"></span>
                  </div>
                  <span className="text-sm font-semibold text-white">
                    Sem projeto
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entries.filter(e => !e.projectId).length} tarefas
                  </span>
                </div>
              </div>
              <div className="border-t border-[#2A2A2A]/50">
                {entries.filter(e => !e.projectId).map((entry, idx, arr) => {
                  const h = Math.floor(entry.duration / 3600);
                  const m = Math.floor((entry.duration % 3600) / 60);
                  const formattedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
                  
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-6 py-3.5 hover:bg-[#1E1E1E] transition-colors cursor-pointer group ${
                        idx < arr.length - 1 ? "border-b border-[#2A2A2A]/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 pl-7">
                        <span className="text-sm text-muted-foreground font-medium truncate max-w-[200px]">
                          {entry.taskName || "Tarefa sem nome"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground font-medium tabular-nums">
                          {formattedTime}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-[#2A2A2A] hover:text-white transition-all cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32 bg-[#1A1A1A] border-[#2A2A2A]">
                            <DropdownMenuItem
                              onClick={() => deleteEntry(entry.id)}
                              className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer flex items-center gap-2"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
