import SwiftUI
import SwiftData

struct TaskDetailView: View {
    @Bindable var task: TaskItem

    var body: some View {
        Form {
            Section("Details") {
                TextField("Title", text: $task.title)
                TextField("Notes", text: $task.detail)
            }
            Section("Status") {
                Toggle("Completed", isOn: $task.isCompleted)
                Stepper("Focus goal: \(task.focusMinutesGoal) minutes", value: $task.focusMinutesGoal, in: 10...120, step: 5)
            }
            Section("Subtasks") {
                if task.subtasks.isEmpty {
                    Text("No subtasks yet")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    ForEach(task.subtasks.sorted { $0.order < $1.order }) { subtask in
                        HStack {
                            Button {
                                subtask.isCompleted.toggle()
                            } label: {
                                Image(systemName: subtask.isCompleted ? "checkmark.circle.fill" : "circle")
                                    .foregroundStyle(subtask.isCompleted ? .green : .secondary)
                            }
                            VStack(alignment: .leading, spacing: 4) {
                                Text(subtask.title)
                                    .font(.subheadline)
                                Text("\(subtask.durationMinutes) min • reward \(subtask.rewardMinutes) min")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                        }
                    }
                }
            }
            Section("Focus") {
                NavigationLink("Start focus session") {
                    FocusTimerView(task: task)
                }
            }
        }
        .navigationTitle("Task")
        .navigationBarTitleDisplayMode(.inline)
    }
}
