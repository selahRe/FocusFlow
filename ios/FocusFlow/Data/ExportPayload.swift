import Foundation
import UniformTypeIdentifiers
import SwiftUI

struct ExportPayload: Codable, Transferable {
    let generatedAt: Date
    let tasks: [TaskDTO]
    let sessions: [SessionDTO]
    let habits: [HabitDTO]
    let moods: [MoodDTO]
    let reminders: [ReminderDTO]

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(exportedContentType: .json) { payload in
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            return try encoder.encode(payload)
        }
        .suggestedFileName("FocusFlow-export.json")
    }

    struct TaskDTO: Codable {
        let id: UUID
        let title: String
        let detail: String
        let isCompleted: Bool
        let createdAt: Date
        let focusMinutesGoal: Int

        init(item: TaskItem) {
            self.id = item.id
            self.title = item.title
            self.detail = item.detail
            self.isCompleted = item.isCompleted
            self.createdAt = item.createdAt
            self.focusMinutesGoal = item.focusMinutesGoal
        }
    }

    struct SessionDTO: Codable {
        let startedAt: Date
        let durationMinutes: Int
        let taskId: UUID?
        let taskTitle: String?

        init(item: FocusSession) {
            self.startedAt = item.startedAt
            self.durationMinutes = item.durationMinutes
            self.taskId = item.taskId
            self.taskTitle = item.taskTitle
        }
    }

    struct HabitDTO: Codable {
        let id: UUID
        let anchorHabit: String
        let newHabit: String
        let minimumVersion: String
        let timeOfDay: String
        let streak: Int
        let lastCompletedDate: Date?
        let completedToday: Bool
        let createdAt: Date

        init(item: HabitAnchor) {
            self.id = item.id
            self.anchorHabit = item.anchorHabit
            self.newHabit = item.newHabit
            self.minimumVersion = item.minimumVersion
            self.timeOfDay = item.timeOfDay
            self.streak = item.streak
            self.lastCompletedDate = item.lastCompletedDate
            self.completedToday = item.completedToday
            self.createdAt = item.createdAt
        }
    }

    struct MoodDTO: Codable {
        let date: Date
        let moodScore: Int
        let note: String

        init(item: MoodEntry) {
            self.date = item.date
            self.moodScore = item.moodScore
            self.note = item.note
        }
    }

    struct ReminderDTO: Codable {
        let id: UUID
        let title: String
        let time: Date
        let isEnabled: Bool
        let repeatWeekdays: [Int]
        let createdAt: Date

        init(item: ReminderItem) {
            self.id = item.id
            self.title = item.title
            self.time = item.time
            self.isEnabled = item.isEnabled
            self.repeatWeekdays = item.repeatWeekdays
            self.createdAt = item.createdAt
        }
    }
}
