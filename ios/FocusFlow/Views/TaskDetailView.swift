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
