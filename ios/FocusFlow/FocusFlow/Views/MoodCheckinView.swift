import SwiftUI
import SwiftData

struct MoodCheckinView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var moodScore = 3
    @State private var note = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("Mood") {
                    Stepper("Score: \(moodScore)", value: $moodScore, in: 1...5)
                }
                Section("Note") {
                    TextField("Optional note", text: $note)
                }
            }
            .navigationTitle("Mood Check-in")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") { saveMood() }
                }
            }
        }
    }

    private func saveMood() {
        let entry = MoodEntry(date: Date(), moodScore: moodScore, note: note)
        modelContext.insert(entry)
        try? modelContext.save()
        dismiss()
    }
}
