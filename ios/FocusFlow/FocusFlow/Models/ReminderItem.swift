import Foundation
import SwiftData

@Model
final class ReminderItem {
    @Attribute(.unique) var id: UUID
    var title: String
    var time: Date
    var isEnabled: Bool
    var repeatWeekdays: [Int]
    var createdAt: Date

    init(title: String, time: Date, repeatWeekdays: [Int] = []) {
        self.id = UUID()
        self.title = title
        self.time = time
        self.isEnabled = true
        self.repeatWeekdays = repeatWeekdays
        self.createdAt = Date()
    }
}
