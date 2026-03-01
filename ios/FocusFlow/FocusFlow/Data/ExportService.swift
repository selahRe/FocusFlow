import Foundation
import SwiftData

struct ExportService {
    static func buildExportPayload(context: ModelContext) -> Data? {
        let tasks = (try? context.fetch(FetchDescriptor<TaskItem>())) ?? []
        let sessions = (try? context.fetch(FetchDescriptor<FocusSession>())) ?? []
        let habits = (try? context.fetch(FetchDescriptor<HabitAnchor>())) ?? []
        let moods = (try? context.fetch(FetchDescriptor<MoodEntry>())) ?? []
        let reminders = (try? context.fetch(FetchDescriptor<ReminderItem>())) ?? []

        let payload = ExportPayload(
            generatedAt: Date(),
            tasks: tasks.map { ExportPayload.TaskDTO(item: $0) },
            sessions: sessions.map { ExportPayload.SessionDTO(item: $0) },
            habits: habits.map { ExportPayload.HabitDTO(item: $0) },
            moods: moods.map { ExportPayload.MoodDTO(item: $0) },
            reminders: reminders.map { ExportPayload.ReminderDTO(item: $0) }
        )

        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        return try? encoder.encode(payload)
    }
}
