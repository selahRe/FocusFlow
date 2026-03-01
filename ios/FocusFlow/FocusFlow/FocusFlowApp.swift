import SwiftUI
import SwiftData

@main
struct FocusFlowApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            TaskItem.self,
            SubtaskItem.self,
            FocusSession.self,
            HabitAnchor.self,
            MoodEntry.self,
            ReminderItem.self
        ])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        return try! ModelContainer(for: schema, configurations: [config])
    }()

    var body: some Scene {
        WindowGroup {
            RootView()
                .modelContainer(sharedModelContainer)
        }
    }
}
