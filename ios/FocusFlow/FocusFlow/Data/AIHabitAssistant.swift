import Foundation

final class AIHabitAssistant {
    static let shared = AIHabitAssistant()

    func generateMinimumVersion(for habit: String) async -> String {
#if canImport(FoundationModels)
        if #available(iOS 18.0, *) {
            if let result = try? await generateWithFoundationModels(habit: habit) {
                return result
            }
        }
#endif
        return fallbackMinimumVersion(for: habit)
    }

    private func fallbackMinimumVersion(for habit: String) -> String {
        return "Do a 1-minute version of \(habit.lowercased())"
    }
}

#if canImport(FoundationModels)
import FoundationModels

@available(iOS 18.0, *)
private extension AIHabitAssistant {
    @Generable
    struct MinimumVersion {
        var action: String
    }

    func generateWithFoundationModels(habit: String) async throws -> String {
        let model = SystemLanguageModel.default
        guard case .available = model.availability else {
            return fallbackMinimumVersion(for: habit)
        }

        let instructions = """
        You are a focus coach. Generate a tiny, 2-second habit action.\
        Keep it under 12 words and make it practical.
        """

        let prompt = "Habit: \(habit)"
        let session = LanguageModelSession(instructions: instructions)
        let response = try await session.respond(to: prompt, generating: MinimumVersion.self)
        return response.action.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
#endif
