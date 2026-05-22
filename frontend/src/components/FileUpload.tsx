'use client';
import { useCallback, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface Props {
  onFileChange: (file: File | null) => void;
  file?: File | null;
}

export default function FileUpload({ onFileChange, file }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFileChange(f);
  }, [onFileChange]);

  if (file) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: 12,
      }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#FFEDD5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={20} color="#F97316" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button onClick={() => onFileChange(null)} style={{ padding: '6px', border: 'none', background: '#FFEDD5', cursor: 'pointer', borderRadius: 8, display: 'flex' }}>
          <X size={14} color="#F97316" />
        </button>
      </div>
    );
  }

  return (
    <label
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px', border: `2px dashed ${dragging ? '#F97316' : '#E5E7EB'}`,
        borderRadius: 14, cursor: 'pointer', transition: 'all 0.15s',
        background: dragging ? '#FFF7ED' : '#FAFAFA',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div style={{
        width: 48, height: 48, borderRadius: '50%', marginBottom: 12,
        background: dragging ? '#FFEDD5' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.15s',
      }}>
        <UploadCloud size={22} color={dragging ? '#F97316' : '#9CA3AF'} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Choose a file or drag &amp; drop it here</p>
      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4, marginBottom: 14 }}>PNG, PDF, JPG, JPEG, DOC, DOCX up to 10MB</p>
      <div style={{
        padding: '7px 18px', border: '1.5px solid #E5E7EB', borderRadius: 10,
        fontSize: 12, fontWeight: 600, color: '#6B7280', background: '#fff',
      }}>
        Browse Files
      </div>
      <input type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={(e) => onFileChange(e.target.files?.[0] || null)} />
    </label>
  );
}
