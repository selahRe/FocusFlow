import Foundation
import SwiftData

@Model
final class TaskItem {
    @Attribute(.unique) var id: UUID
    var title: String
    var detail: String
    var isCompleted: Bool
    var createdAt: Date
    var focusMinutesGoal: Int
    @Relationship(deleteRule: .cascade) var subtasks: [SubtaskItem] = []

    init(title: String, detail: String = "", focusMinutesGoal: Int = 25) {
        self.id = UUID()
        self.title = title
        self.detail = detail
        self.isCompleted = false
        self.createdAt = Date()
        self.focusMinutesGoal = focusMinutesGoal
        self.subtasks = []
    }
}
