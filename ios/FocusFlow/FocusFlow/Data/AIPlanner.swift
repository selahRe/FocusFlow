import Foundation

struct SubtaskDraft: Identifiable, Equatable {
    let id = UUID()
    let title: String
    let durationMinutes: Int
    let rewardMinutes: Int
}

enum AIPlannerError: Error {
    case unavailable(String)
}

final class AIPlanner {
    static let shared = AIPlanner()

    func generateSubtasks(title: String, detail: String, goalMinutes: Int) async -> [SubtaskDraft] {
#if canImport(FoundationModels)
        if #available(iOS 18.0, *) {
            if let result = try? await generateWithFoundationModels(title: title, detail: detail, goalMinutes: goalMinutes) {
                return result
            }
        }
#endif
        return fallbackSubtasks(title: title, goalMinutes: goalMinutes)
    }

    private func fallbackSubtasks(title: String, goalMinutes: Int) -> [SubtaskDraft] {
        let chunk = max(15, min(25, goalMinutes))
        let count = max(1, Int(ceil(Double(goalMinutes) / Double(chunk))))
        return (0..<count).map { index in
            SubtaskDraft(
                title: "Step \(index + 1): \(title)",
                durationMinutes: chunk,
                rewardMinutes: 5
            )
        }
    }
}

#if canImport(FoundationModels)
import FoundationModels

@available(iOS 18.0, *)
private extension AIPlanner {
    @Generable
    struct SubtaskPlan {
        var subtasks: [Subtask]
    }

    @Generable
    struct Subtask {
        var title: String
        var durationMinutes: Int
        var rewardMinutes: Int
    }

    func generateWithFoundationModels(title: String, detail: String, goalMinutes: Int) async throws -> [SubtaskDraft] {
        let model = SystemLanguageModel.default
        switch model.availability {
        case .available:
            break
        case .unavailable(let reason):
            return fallbackSubtasks(title: title, goalMinutes: goalMinutes)
        }

        let instructions = """
        You are a focus coach. Break a task into 15-25 minute subtasks.\
        Prefer simple-to-hard ordering. After each subtask, assign 5 minutes reward.\
        Keep titles short and actionable.
        """

        let prompt = """
        Task: \(title)
        Notes: \(detail.isEmpty ? "(none)" : detail)
        Total focus minutes: \(goalMinutes)
        """

        let session = LanguageModelSession(instructions: instructions)
        let plan = try await session.respond(to: prompt, generating: SubtaskPlan.self)
        return plan.subtasks.enumerated().map { index, item in
            SubtaskDraft(
                title: item.title,
                durationMinutes: max(5, item.durationMinutes),
                rewardMinutes: max(0, item.rewardMinutes)
            )
        }
    }
}
#endif
