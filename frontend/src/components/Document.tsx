import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const Document: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      try {
        const response = await axios.get(`/api/documents/${id}`);
        setContent(response.data.data);
      } catch (error) {
        setError("Document not found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleNew = () => {
    navigate("/");
  };

  const handleRaw = () => {
    window.open(`/api/raw/${id}`, "_blank");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      alert("Copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getLineNumbers = () => {
    const lines = content.split("\n");
    return lines.map((_, index) => index + 1).join("\n");
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h2>{error}</h2>
        <button onClick={handleNew}>Create New</button>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Saki-Chan Paste</h1>
        <div className="controls">
          <button onClick={handleNew} className="new-btn">
            New
          </button>
          <button onClick={handleRaw} className="raw-btn">
            Raw
          </button>
          <button onClick={handleCopy} className="copy-btn">
            Copy
          </button>
        </div>
      </header>

      <div className="document-container">
        <div className="line-numbers">
          <pre>{getLineNumbers()}</pre>
        </div>
        <pre className="document-content">{content}</pre>
      </div>
    </div>
  );
};

export default Document;
