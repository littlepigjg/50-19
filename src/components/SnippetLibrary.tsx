import React, { useState, useEffect, useMemo } from 'react';
import type { CodeSnippet, ProgramBlock, Program } from '../engine/types';
import { BUILTIN_SNIPPETS, SNIPPET_CATEGORIES } from '../engine/snippets';
import {
  loadCustomSnippets,
  deleteSnippetFromLibrary,
  saveSnippetToLibrary,
} from '../engine/storage';
import { BLOCK_CONFIGS } from '../engine/blocks';
import { cloneBlock } from '../engine/blockUtils';

interface SnippetLibraryProps {
  onBack?: () => void;
  onLoadSnippet?: (program: Program) => void;
  isModal?: boolean;
  onClose?: () => void;
  currentProgram?: Program;
  showSaveButton?: boolean;
  allowedBlocks?: string[];
}

const ReadOnlyBlock: React.FC<{ block: ProgramBlock; depth?: number }> = ({
  block,
  depth = 0,
}) => {
  const config = BLOCK_CONFIGS[block.type];
  const hasChildren = config.hasChildren && block.children && block.children.length > 0;

  return (
    <div
      className={`
        relative ${config.color} block-shadow-sm text-white rounded-lg
        my-1 transition-all duration-200
      `}
      style={{ marginLeft: depth > 0 ? `${depth * 4}px` : 0 }}
    >
      <div className="flex items-center gap-2 p-2">
        <span className="text-lg flex-shrink-0">{config.icon}</span>
        <span className="text-sm font-bold truncate">{config.label}</span>
        {block.type === 'loop' && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded flex-shrink-0">
            ×{block.repeatCount || 2}
          </span>
        )}
        {(block.type === 'function' || block.type === 'callFunction') && (
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded flex-shrink-0">
            {block.functionId || 'func1'}
          </span>
        )}
      </div>
      {hasChildren && (
        <div
          className="m-2 p-2 rounded-lg border-2 border-dashed border-white/40"
          style={{ backgroundColor: `${config.color.replace('bg-', '')}33` }}
        >
          {block.children!.map((child) => (
            <ReadOnlyBlock key={child.id} block={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const SaveSnippetModal: React.FC<{
  program: Program;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}> = ({ program, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const blockCount = useMemo(() => {
    const count = (blocks: ProgramBlock[]): number => {
      let c = 0;
      for (const b of blocks) {
        c++;
        if (b.children) c += count(b.children);
      }
      return c;
    };
    return count(program.main);
  }, [program]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="game-card p-6 max-w-md w-full animate-pop">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          💾 保存到片段库
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              片段名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：我的迷宫解法"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              思路描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简单描述一下这个解法的思路..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none resize-none h-24"
              maxLength={200}
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            <span className="font-medium">当前程序：</span>
            共 {blockCount} 个指令块
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                onSave(name.trim(), description.trim());
              }
            }}
            disabled={!name.trim()}
            className="btn-primary"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

const SnippetDetail: React.FC<{
  snippet: CodeSnippet;
  onBack: () => void;
  onLoad?: (program: Program) => void;
  onDelete?: (id: string) => void;
}> = ({ snippet, onBack, onLoad, onDelete }) => {
  const clonedProgram = useMemo(() => {
    return {
      main: snippet.program.main.map(cloneBlock),
      functions: snippet.program.functions,
    };
  }, [snippet]);

  return (
    <div className="animate-fadeIn">
      <button
        onClick={onBack}
        className="btn-secondary !py-2 !px-4 mb-4 flex items-center gap-2"
      >
        ← 返回列表
      </button>

      <div className="game-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                {SNIPPET_CATEGORIES[snippet.category]}
              </span>
              {snippet.isBuiltin && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                  官方
                </span>
              )}
              <div className="flex gap-0.5 ml-2">
                {Array.from({ length: Math.max(snippet.difficulty, 1) }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-sm">
                    ★
                  </span>
                ))}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{snippet.name}</h2>
            <p className="text-gray-600 mt-1">{snippet.description}</p>
          </div>

          <div className="flex gap-2">
            {onLoad && (
              <button
                onClick={() => onLoad(clonedProgram)}
                className="btn-success flex items-center gap-2"
              >
                📥 使用此方案
              </button>
            )}
            {!snippet.isBuiltin && onDelete && (
              <button
                onClick={() => {
                  if (confirm('确定要删除这个片段吗？')) {
                    onDelete(snippet.id);
                    onBack();
                  }
                }}
                className="btn-danger !py-2 !px-3 !text-sm"
              >
                🗑️ 删除
              </button>
            )}
          </div>
        </div>

        {snippet.tags.length > 0 && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {snippet.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              💡 解题思路
            </h3>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 whitespace-pre-line text-gray-700 leading-relaxed">
              {snippet.explanation}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              📝 程序结构
            </h3>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto">
              {snippet.program.main.length > 0 ? (
                snippet.program.main.map((block) => (
                  <ReadOnlyBlock key={block.id} block={block} />
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">空程序</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SnippetLibrary: React.FC<SnippetLibraryProps> = ({
  onBack,
  onLoadSnippet,
  isModal = false,
  onClose,
  currentProgram,
  showSaveButton = false,
}) => {
  const [customSnippets, setCustomSnippets] = useState<CodeSnippet[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    CodeSnippet['category'] | 'all'
  >('all');
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    setCustomSnippets(loadCustomSnippets());
  }, []);

  const refreshCustom = () => {
    setCustomSnippets(loadCustomSnippets());
  };

  const allSnippets = useMemo(
    () => [...BUILTIN_SNIPPETS, ...customSnippets],
    [customSnippets]
  );

  const filteredSnippets = useMemo(() => {
    return allSnippets.filter((s) => {
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allSnippets, selectedCategory, searchQuery]);

  const handleSave = (name: string, description: string) => {
    if (currentProgram) {
      saveSnippetToLibrary(name, description, currentProgram);
      refreshCustom();
      setShowSaveModal(false);
    }
  };

  const handleDelete = (id: string) => {
    deleteSnippetFromLibrary(id);
    refreshCustom();
  };

  const categories: Array<CodeSnippet['category'] | 'all'> = [
    'all',
    'movement',
    'search',
    'maze',
    'pattern',
    'custom',
  ];

  const content = (
    <div className={`${isModal ? '' : 'min-h-screen py-8 px-4'}`}>
      <div className={`${isModal ? '' : 'max-w-5xl mx-auto'}`}>
        {!isModal && (
          <div className="game-card p-6 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="btn-secondary !py-2 !px-4 flex items-center gap-2"
                  >
                    ← 返回
                  </button>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    📚 代码片段库
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    浏览经典编程模式，保存你的优秀解法
                  </p>
                </div>
              </div>

              {showSaveButton && currentProgram && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  💾 保存当前方案
                </button>
              )}
            </div>

            <div className="mt-6 flex gap-4 items-center flex-wrap">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 搜索片段..."
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                      ${selectedCategory === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    {cat === 'all' ? '全部' : SNIPPET_CATEGORIES[cat]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {isModal && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📚 代码片段库
            </h2>
            {onClose && (
              <button onClick={onClose} className="btn-secondary !py-2 !px-3">
                关闭
              </button>
            )}
          </div>
        )}

        {isModal && (
          <div className="mb-4 flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 搜索..."
                className="w-full px-3 py-1.5 pl-9 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
                    ${selectedCategory === cat
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {cat === 'all' ? '全部' : SNIPPET_CATEGORIES[cat].split(' ')[1] || cat}
                </button>
              ))}
            </div>
            {showSaveButton && currentProgram && (
              <button
                onClick={() => setShowSaveModal(true)}
                className="btn-primary !py-1.5 !px-3 !text-sm ml-auto"
              >
                💾 保存
              </button>
            )}
          </div>
        )}

        {selectedSnippet ? (
          <SnippetDetail
            snippet={selectedSnippet}
            onBack={() => setSelectedSnippet(null)}
            onLoad={onLoadSnippet}
            onDelete={handleDelete}
          />
        ) : filteredSnippets.length === 0 ? (
          <div className="game-card p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-gray-500">没有找到匹配的片段</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="btn-secondary mt-4"
            >
              清除筛选
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSnippets.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => setSelectedSnippet(snippet)}
                className={`game-card p-5 text-left hover:scale-[1.02] hover:shadow-2xl transition-all duration-200 cursor-pointer
                  ${snippet.isBuiltin ? '' : 'border-2 border-purple-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      snippet.isBuiltin
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {snippet.isBuiltin ? '官方' : '我的'}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.max(snippet.difficulty, 1) }).map((_, i) => (
                      <span key={i} className="text-yellow-400 text-xs">
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-1">{snippet.name}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {snippet.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {SNIPPET_CATEGORIES[snippet.category]}
                  </span>
                  <div className="flex gap-1">
                    {snippet.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {showSaveModal && currentProgram && (
        <SaveSnippetModal
          program={currentProgram}
          onClose={() => setShowSaveModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="game-card p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-pop">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default SnippetLibrary;
