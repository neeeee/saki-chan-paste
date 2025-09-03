import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Home: React.FC = () => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post("/api/documents", { content });
      navigate(`/${response.data.key}`);
    } catch (error) {
      console.error("Error saving document:", error);
      alert("Error saving document");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
      return;
    }

    // Handle tab key for 2-space indentation
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lines = content.split("\n");
        const startLine = content.substring(0, start).split("\n").length - 1;
        const endLine = content.substring(0, end).split("\n").length - 1;

        let newContent = "";
        let selectionAdjustment = 0;
        let endAdjustment = 0;

        for (let i = 0; i < lines.length; i++) {
          if (i >= startLine && i <= endLine) {
            if (lines[i].startsWith("  ")) {
              lines[i] = lines[i].substring(2);
              if (i === startLine) selectionAdjustment = -2;
              endAdjustment -= 2;
            }
          }
        }

        newContent = lines.join("\n");
        setContent(newContent);

        // Restore selection
        setTimeout(() => {
          textarea.selectionStart = Math.max(0, start + selectionAdjustment);
          textarea.selectionEnd = Math.max(0, end + endAdjustment);
        }, 0);
      } else {
        // Tab: Add indentation
        if (start === end) {
          // No selection, just insert 2 spaces
          const newContent =
            content.substring(0, start) + "  " + content.substring(end);
          setContent(newContent);

          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 2;
          }, 0);
        } else {
          // Selection exists, indent all selected lines
          const lines = content.split("\n");
          const startLine = content.substring(0, start).split("\n").length - 1;
          const endLine = content.substring(0, end).split("\n").length - 1;

          for (let i = startLine; i <= endLine; i++) {
            lines[i] = "  " + lines[i];
          }

          const newContent = lines.join("\n");
          setContent(newContent);

          setTimeout(() => {
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = end + (endLine - startLine + 1) * 2;
          }, 0);
        }
      }
    }
  };

  const getLineNumbers = () => {
    const lines = content.split("\n");
    return lines.map((_, index) => index + 1).join("\n");
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Saki-Chan Paste</h1>
        <div className="controls">
          <button
            onClick={handleSave}
            disabled={!content.trim() || isLoading}
            className="save-btn"
          >
            {isLoading ? "Saving..." : "Save (Ctrl+S)"}
          </button>
        </div>
      </header>

      <div className="editor-container">
        <div className="line-numbers">
          <pre>{getLineNumbers()}</pre>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste your text here..."
          className="editor"
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default Home;
