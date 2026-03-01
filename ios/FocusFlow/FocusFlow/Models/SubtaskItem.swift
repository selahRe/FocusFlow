import Foundation
import SwiftData

@Model
final class SubtaskItem {
    var title: String
    var durationMinutes: Int
    var rewardMinutes: Int
    var isCompleted: Bool
    var order: Int

    init(title: String, durationMinutes: Int, rewardMinutes: Int, order: Int) {
        self.title = title
        self.durationMinutes = durationMinutes
        self.rewardMinutes = rewardMinutes
        self.isCompleted = false
        self.order = order
    }
}
