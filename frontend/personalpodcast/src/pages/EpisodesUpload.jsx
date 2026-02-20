import { useMemo, useState } from "react";
import axios from "axios";

export default function EpisodesUpload() {

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: "" });

    const token = localStorage.getItem("token");
    if (token) instance.defaults.headers.common.Authorization = `Bearer ${token}`;

    return instance;
  }, []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [category, setCategory] = useState("");
  const [season, setSeason] = useState("");
  const [audioFile, setAudioFile] = useState(null);

  const [q, setQ] = useState("");

  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const resetUploadForm = () => {
    setTitle("");
    setDescription("");
    setDurationSeconds("");
    setCategory("");
    setSeason("");
    setAudioFile(null);
  };

  async function handleUpload(e) {
    e.preventDefault();
    setUploadMsg("");

    // Validimi
    if (!title.trim()) return setUploadMsg("Title is required.");
    const dur = Number(durationSeconds);
    if (!Number.isFinite(dur) || dur <= 0) return setUploadMsg("DurationSeconds must be > 0.");
    if (!audioFile) return setUploadMsg("Please choose an audio file (mp3).");

    try {
      setUploading(true);

  const fd = new FormData();
fd.append("title", title.trim());
fd.append("description", description);
fd.append("durationSeconds", String(dur));
fd.append("category", category);
fd.append("season", season ? String(Number(season)) : "");
fd.append("isPublished", "true");
fd.append("file", audioFile); 
      const res = await api.post("/api/upload", fd, {
  headers: { "Content-Type": "multipart/form-data" },
});


      setUploadMsg(`✅ Uploaded! Episode ID: ${res.data?.id ?? "(saved)"}`);
      resetUploadForm();
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Upload failed. Check backend logs / Cloudinary keys / CORS.";
      setUploadMsg(`❌ ${message}`);
    } finally {
      setUploading(false);
    }
  }


  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <h2>Podcast Episodes (Upload + Search)</h2>

      {/* uploadi */}
      <section style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14, marginBottom: 18 }}>
        <h3>Upload new episode</h3>

        <form onSubmit={handleUpload} style={{ display: "grid", gap: 10 }}>
          <label>
            Title *
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Episode title"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              rows={3}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label>
              DurationSeconds *
              <input
                type="number"
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(e.target.value)}
                placeholder="e.g. 600"
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </label>

            <label>
              Season (optional)
              <input
                type="number"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. 1"
                style={{ width: "100%", padding: 8, marginTop: 4 }}
              />
            </label>
          </div>

          <label>
            Category (optional)
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Tech"
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <label>
            Audio file (mp3) *
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
              style={{ width: "100%", padding: 8, marginTop: 4 }}
            />
          </label>

          <button type="submit" disabled={uploading} style={{ padding: 10 }}>
            {uploading ? "Uploading..." : "Upload Episode"}
          </button>

          {uploadMsg && <div style={{ padding: 10, background: "#f6f6f6", borderRadius: 8 }}>{uploadMsg}</div>}
        </form>
      </section>

    
    </div>
  );
}
