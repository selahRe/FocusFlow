import SwiftUI
import SwiftData

struct FocusTimerView: View {
    @Environment(\.modelContext) private var modelContext

    let task: TaskItem?
    @State private var selectedMinutes = 25
    @State private var remainingSeconds = 25 * 60
    @State private var isRunning = false
    @State private var showingCoach = false

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            AppTheme.backgroundGradient
                .ignoresSafeArea()

            VStack(spacing: 16) {
                SectionCard(title: task?.title ?? "Focus Session") {
                    VStack(spacing: 12) {
                        if let detail = task?.detail, !detail.isEmpty {
                            Text(detail)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Text(timeString(from: remainingSeconds))
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .monospacedDigit()
                    }
                }

                SectionCard(title: "Session Length") {
                    Picker("Minutes", selection: $selectedMinutes) {
                        ForEach([15, 25, 45, 60], id: \.self) { value in
                            Text("\(value)m").tag(value)
                        }
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: selectedMinutes) { _, newValue in
                        if !isRunning {
                            remainingSeconds = newValue * 60
                        }
                    }
                }

                HStack(spacing: 16) {
                    Button(isRunning ? "Pause" : "Start") {
                        isRunning.toggle()
                    }
                    .buttonStyle(.borderedProminent)

                    Button("Reset") {
                        isRunning = false
                        remainingSeconds = selectedMinutes * 60
                    }
                    .buttonStyle(.bordered)
                }

                Button("Log Session") {
                    logSession(minutes: selectedMinutes)
                    remainingSeconds = selectedMinutes * 60
                    isRunning = false
                }
                .buttonStyle(.bordered)

                Button("Need Help?") {
                    isRunning = false
                    showingCoach = true
                }
                .buttonStyle(.bordered)
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
        }
        .onReceive(timer) { _ in
            guard isRunning else { return }
            if remainingSeconds > 0 {
                remainingSeconds -= 1
            } else {
                isRunning = false
                logSession(minutes: selectedMinutes)
                remainingSeconds = selectedMinutes * 60
            }
        }
        .onAppear {
            remainingSeconds = selectedMinutes * 60
        }
        .sheet(isPresented: $showingCoach) {
            FocusCoachView(taskTitle: task?.title)
        }
    }

    private func timeString(from seconds: Int) -> String {
        let minutes = max(seconds, 0) / 60
        let secs = max(seconds, 0) % 60
        return String(format: "%02d:%02d", minutes, secs)
    }

    private func logSession(minutes: Int) {
        let session = FocusSession(
            startedAt: Date().addingTimeInterval(TimeInterval(-minutes * 60)),
            durationMinutes: minutes,
            taskId: task?.id,
            taskTitle: task?.title
        )
        modelContext.insert(session)
        try? modelContext.save()
    }
}
