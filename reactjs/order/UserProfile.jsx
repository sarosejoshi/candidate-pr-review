// UserProfile.jsx — Intentional mix of patterns for interview discussion
import React, { useState, useEffect, useCallback, useMemo } from "react";

// ⚠️ Anti-pattern: global mutable state
let globalCache = {};

export default function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ⚠️ Anti-pattern: effect without cleanup, no abort, no deps control
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        globalCache[userId] = data; // ⚠️ mutable global cache
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []); // ⚠️ missing userId dependency

  // ⚠️ Anti-pattern: deriving state on every render, no memoization
  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(filter.toLowerCase())
  );

  // ⚠️ Anti-pattern: inline function recreated every render
  const handleSearch = (e) => {
    setFilter(e.target.value);
  };

  // ⚠️ Anti-pattern: dangerouslySetInnerHTML without sanitization
  const renderBio = () => {
    if (!user?.bio) return null;
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: user.bio, // ⚠️ XSS risk if bio comes from user/CMS
        }}
      />
    );
  };

  // ⚠️ Anti-pattern: list without key, potential re-render issues
  const renderPosts = () => {
    return filteredPosts.map((post) => (
      <div className="post-card">
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <button onClick={() => console.log("View", post.id)}>View</button>
      </div>
    ));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      {renderBio()}

      <input
        type="text"
        placeholder="Search posts..."
        value={filter}
        onChange={handleSearch} // ⚠️ uncontrolled input pattern mixed
      />

      <div className="posts-list">{renderPosts()}</div>

      {/* ⚠️ Anti-pattern: third-party script injection without nonce/CSP */}
      <script
        dangerouslySetInnerHTML={{
          __html: `console.log("Tracking:", "${user.email}")`,
        }}
      />
    </div>
  );
}
