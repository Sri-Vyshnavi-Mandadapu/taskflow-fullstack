import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ column, tasks, totalCount, onEdit, onDelete, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className="column-title">
          <span className={`status-dot ${column.color}`} />
          <h3>{column.title}</h3>
          <span className="task-count">{totalCount}</span>
        </div>

        <button
          className="column-menu"
          onClick={onAdd}
          aria-label={`Add task to ${column.title}`}
        >
          ＋
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={`task-list ${isOver ? "drag-over" : ""}`}
      >
        {tasks.length === 0 ? (
          <div className="empty-column">
            <span>✦</span>
            <p>No tasks here</p>
            <small>Drag a task here or add a new one</small>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
