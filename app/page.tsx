"use client";
import { useEffect, useState } from "react";

type Post = {
  id: string;
  timestamp: string;
  text: string;
  imageUrl: string | null;
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadPosts() {
    const res = await fetch("/api/posts");
    const data: Post[] = await res.json();
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    await fetch("/api/submit", { method: "POST", body: formData });
    form.reset();
    await loadPosts();
    setSubmitting(false);
  }

  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: 16, fontFamily: "monospace" }}>
      <form onSubmit={handleSubmit}>
        <textarea name="text" rows={4} style={{ width: "100%", display: "block" }} placeholder="write something" required />
        <input name="image" type="file" accept="image/*" />
        <button type="submit" disabled={submitting}>{submitting ? "posting..." : "post"}</button>
      </form>

      <hr />

      {loading && <p>loading...</p>}

      {posts.map((p) => (
        <div key={p.id} style={{ marginBottom: 32 }}>
          <small>{new Date(p.timestamp).toLocaleString()}</small>
          <p style={{ whiteSpace: "pre-wrap" }}>{p.text}</p>
          {p.imageUrl && (
            <img src={p.imageUrl} alt="" style={{ maxWidth: "100%" }} />
          )}
          <hr />
        </div>
      ))}
    </main>
  );
}
