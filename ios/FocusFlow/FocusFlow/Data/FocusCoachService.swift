import Foundation

struct CoachMessage: Identifiable, Equatable {
    let id = UUID()
    let isUser: Bool
    let text: String
}

final class FocusCoachService {
    static let shared = FocusCoachService()

    func respond(to message: String, taskTitle: String?) async -> String {
#if canImport(FoundationModels)
        if #available(iOS 18.0, *) {
            if let result = try? await respondWithFoundationModels(message: message, taskTitle: taskTitle) {
                return result
            }
        }
#endif
        return fallbackResponse(for: message)
    }

    private func fallbackResponse(for message: String) -> String {
        if message.lowercased().contains("distract") {
            return "Try a 60-second reset: breathe, write the distraction, and return to one small step."
        }
        return "Pick the smallest next step and set a 5-minute timer. I am here if you need help."
    }
}

#if canImport(FoundationModels)
import FoundationModels

@available(iOS 18.0, *)
private extension FocusCoachService {
    func respondWithFoundationModels(message: String, taskTitle: String?) async throws -> String {
        let model = SystemLanguageModel.default
        guard case .available = model.availability else {
            return fallbackResponse(for: message)
        }

        let context = taskTitle == nil ? "" : "Current task: \(taskTitle!)"
        let instructions = """
        You are a gentle focus coach for ADHD users. Respond in 1-3 sentences.\
        Give concrete, supportive advice and a single next step.
        """

        let prompt = """
        \(context)
        User message: \(message)
        """

        let session = LanguageModelSession(instructions: instructions)
        let response = try await session.respond(to: prompt)
        return response.text.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
#endif
