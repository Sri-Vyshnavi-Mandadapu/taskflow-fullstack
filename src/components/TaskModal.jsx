import { useState } from "react";

export default function TaskModal({ mode, task, onClose, onSave, saving, error, onReload, initialStatus = "todo" }) {
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    id: task?.id || crypto.randomUUID(),
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || initialStatus,
    priority: task?.priority || "medium",
    tags: task?.tags?.join(", ") || "",
    createdAt: task?.createdAt || Date.now(),
  });

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) return;

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="modal-backdrop" onMouseDown={saving ? undefined : onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">TASK MANAGEMENT</p>
            <h2 id="modal-title">{isEdit ? "Edit Task" : "Create Task"}</h2>
          </div>
          <button className="modal-close" disabled={saving} onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="connection-error" role="alert">{error}
          <button type="button" className="secondary-button" onClick={onReload}>Reload board</button>
        </div>}
        <form onSubmit={handleSubmit}>
          <fieldset disabled={saving} className="task-fields">
          <label>
            Task Title *
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              maxLength={200}
              placeholder="e.g. Complete project report"
              required
              autoFocus
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              maxLength={5000}
              placeholder="Add a description..."
              rows="3"
            />
          </label>

          <div className="form-row">
            <label>
              Status
              <select
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>

            <label>
              Priority
              <select
                value={form.priority}
                onChange={(e) => updateField("priority", e.target.value)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>

          <label>
            Tags
            <input
              type="text"
              value={form.tags}
              onChange={(e) => updateField("tags", e.target.value)}
              placeholder="React, Frontend, College"
            />
            <small>Separate tags with commas.</small>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
