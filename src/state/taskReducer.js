export default function taskReducer(state, action) {
  switch (action.type) {
    case "ADD_TASK":
      return [...state, action.task];

    case "UPDATE_TASK":
      return state.map((task) =>
        task.id === action.task.id ? action.task : task
      );

    case "DELETE_TASK":
      return state.filter((task) => task.id !== action.id);

    case "MOVE_TASK":
      return state.map((task) =>
        task.id === action.id
          ? { ...task, status: action.status }
          : task
      );

    case "REORDER_TASKS": {
      const { activeId, overId } = action;
      const oldIndex = state.findIndex((task) => task.id === activeId);
      const newIndex = state.findIndex((task) => task.id === overId);

      if (oldIndex === -1 || newIndex === -1) return state;

      const updated = [...state];
      const [movedTask] = updated.splice(oldIndex, 1);
      updated.splice(newIndex, 0, movedTask);
      return updated;
    }

    default:
      return state;
  }
}
