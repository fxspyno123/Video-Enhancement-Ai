import React, { useState } from 'react';
import { Bot, Sparkles, Send, Check, ArrowRight, CornerDownLeft, Loader2, AlertCircle } from 'lucide-react';
import { VideoMetadata, AssistantChangeProposal } from '../../types';

interface AssistantWorkspaceProps {
  currentVideo: VideoMetadata | null;
  onApplyProposal: (proposal: AssistantChangeProposal) => void;
}

export const AssistantWorkspace: React.FC<AssistantWorkspaceProps> = ({
  currentVideo,
  onApplyProposal,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState<AssistantChangeProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  const samplePrompts = [
    'Enhance this video and upscale it to 4K.',
    'Restore this old video and remove grain.',
    'Make the colors cinematic with teal & orange look.',
    'Convert this video to 9:16 vertical without losing content with a blurred background.',
    'Make the video smoother at 60 FPS using optical flow.',
    'Enhance this anime edit with clean sharp line-art.',
    'Trim from 1 second to 5 seconds and boost saturation.',
  ];

  const handleSubmit = async (textToSubmit?: string) => {
    const query = textToSubmit || prompt;
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setProposal(null);
    setHasApplied(false);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          currentMetadata: currentVideo,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setProposal(data);
    } catch (err: any) {
      setError(err.message || 'Failed to interpret prompt with Gemini AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (proposal) {
      onApplyProposal(proposal);
      setHasApplied(true);
    }
  };

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full text-xs">
      <div className="border-b border-[#1c2638] pb-3">
        <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-sm">
          <Bot className="w-4 h-4 text-fuchsia-400" />
          <span>Gemini AI Prompt-to-Edit Assistant</span>
        </h3>
        <p className="text-[11px] text-zinc-400">
          Describe the desired transformation in natural language. Gemini translates your intent into validated technical studio parameters.
        </p>
      </div>

      {/* Input box */}
      <div className="space-y-2">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="e.g. Enhance this video and upscale it to 4K with cinematic colors and 60 FPS optical flow..."
            className="w-full bg-[#101622] border border-[#222f44] focus:border-fuchsia-500 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none min-h-[85px] resize-none"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || !prompt.trim()}
            className="absolute bottom-2.5 right-2.5 p-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all shadow-md flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sample Quick Prompts */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          Try Example Instructions
        </div>
        <div className="flex flex-wrap gap-1.5">
          {samplePrompts.map((sp) => (
            <button
              key={sp}
              onClick={() => {
                setPrompt(sp);
                handleSubmit(sp);
              }}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-[#111724] hover:bg-[#182133] border border-[#1e2a3c] text-zinc-300 hover:text-white transition-colors text-left"
            >
              "{sp}"
            </button>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Proposed Changes Panel */}
      {proposal && (
        <div className="space-y-3 bg-[#111724] border border-fuchsia-500/40 rounded-xl p-3.5 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-[#222f44] pb-2">
            <div className="flex items-center gap-1.5 text-fuchsia-300 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Proposed Studio Changes</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800/60 font-semibold">
              Step 1 of 2: Review
            </span>
          </div>

          <div className="text-xs font-semibold text-zinc-100">
            {proposal.summary}
          </div>

          <p className="text-[11px] text-zinc-400 leading-relaxed bg-[#0c1018] p-2.5 rounded-lg border border-[#1c2638]">
            {proposal.explanation}
          </p>

          {/* Diff list */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Parameter Modifiers ({proposal.changes.length})
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {proposal.changes.map((ch, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0c1018] border border-[#182232] text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 font-semibold uppercase">{ch.module}</span>
                    <span className="text-zinc-400">{ch.setting}:</span>
                  </div>
                  <div className="font-mono text-fuchsia-300 font-bold">
                    {String(ch.newValue)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleApply}
            disabled={hasApplied}
            className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              hasApplied
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white shadow-fuchsia-500/20 active:scale-95'
            }`}
          >
            {hasApplied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Settings Applied to Studio</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Confirm & Apply Settings to Preview</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
