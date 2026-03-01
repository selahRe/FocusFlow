import Foundation
import SwiftData

@Model
final class MoodEntry {
    var date: Date
    var moodScore: Int
    var note: String

    init(date: Date, moodScore: Int, note: String) {
        self.date = date
        self.moodScore = moodScore
        self.note = note
    }
}
