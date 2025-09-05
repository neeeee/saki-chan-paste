import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DocumentData {
  data: string;
  key: string;
  created_at: string;
  expires_at?: string;
  view_count: number;
}

const Document: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;

      try {
        const response = await axios.get(`/api/documents/${id}`);
        setDocument(response.data);
      } catch (error) {
        setError('Document not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  const handleNew = () => {
    navigate('/');
  };

  const handleRaw = () => {
    window.open(`/api/raw/${id}`, '_blank');
  };

  const handleCopy = async () => {
    if (!document) return;
    
    try {
      await navigator.clipboard.writeText(document.data);
      alert('Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getLineNumbers = () => {
    if (!document) return '';
    const lines = document.data.split('\n');
    return lines.map((_, index) => index + 1).join('\n');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (error || !document) {
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
        <h1>Hastebin Clone</h1>
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
      
      <div className="document-info">
        <span>Created: {formatDate(document.created_at)}</span>
        <span>Views: {document.view_count}</span>
        {document.expires_at && (
          <span>Expires: {formatDate(document.expires_at)}</span>
        )}
      </div>
      
      <div className="document-container">
        <div className="line-numbers">
          <pre>{getLineNumbers()}</pre>
        </div>
        <pre className="document-content">{document.data}</pre>
      </div>
    </div>
  );
};

export default Document;
