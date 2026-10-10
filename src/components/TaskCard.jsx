import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

export default function TaskCard({ task, onEdit, onDelete, overlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`task-card ${isDragging ? "dragging" : ""} ${
        overlay ? "overlay-card" : ""
      }`}
      {...attributes}
    >
      <div className="task-card-top">
        <span className={`priority-badge ${task.priority}`}>
          {task.priority}
        </span>

        <div className="task-actions">
          <button
            onClick={() => onEdit(task)}
            aria-label={`Edit ${task.title}`}
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(task.id)}
            aria-label={`Delete ${task.title}`}
          >
            ×
          </button>
          <button
            className="drag-handle"
            {...listeners}
            aria-label={`Drag ${task.title}`}
          >
            ⠿
          </button>
        </div>
      </div>

      <h4>{task.title}</h4>
      <p className="task-description">{task.description}</p>

      <div className="task-footer">
        <div className="tags">
          {task.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <span className="task-date">
          {new Date(task.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </article>
  );
}
