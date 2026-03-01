import SwiftUI

struct FocusCoachView: View {
    let taskTitle: String?
    @State private var input = ""
    @State private var isSending = false
    @State private var messages: [CoachMessage] = [
        CoachMessage(isUser: false, text: "Tell me what is getting in the way. I will help you refocus.")
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 12) {
                ScrollView {
                    VStack(spacing: 12) {
                        ForEach(messages) { message in
                            HStack {
                                if message.isUser {
                                    Spacer()
                                    TextBubble(text: message.text, isUser: true)
                                } else {
                                    TextBubble(text: message.text, isUser: false)
                                    Spacer()
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                }

                Divider()

                HStack(spacing: 8) {
                    TextField("Ask for help...", text: $input)
                        .textFieldStyle(.roundedBorder)

                    Button(isSending ? "..." : "Send") {
                        send()
                    }
                    .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isSending)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
            .navigationTitle("Focus Coach")
        }
    }

    private func send() {
        let text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        input = ""
        messages.append(CoachMessage(isUser: true, text: text))
        isSending = true

        Task {
            let response = await FocusCoachService.shared.respond(to: text, taskTitle: taskTitle)
            await MainActor.run {
                messages.append(CoachMessage(isUser: false, text: response))
                isSending = false
            }
        }
    }
}

private struct TextBubble: View {
    let text: String
    let isUser: Bool

    var body: some View {
        Text(text)
            .padding(12)
            .background(isUser ? Color.blue.opacity(0.2) : Color.white.opacity(0.8))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color.white.opacity(0.3), lineWidth: 1)
            )
    }
}
