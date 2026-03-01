import Foundation
import SwiftData

@Model
final class FocusSession {
    var startedAt: Date
    var durationMinutes: Int
    var taskId: UUID?
    var taskTitle: String?

    init(startedAt: Date, durationMinutes: Int, taskId: UUID? = nil, taskTitle: String? = nil) {
        self.startedAt = startedAt
        self.durationMinutes = durationMinutes
        self.taskId = taskId
        self.taskTitle = taskTitle
    }
}
