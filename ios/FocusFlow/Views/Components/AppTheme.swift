import SwiftUI

enum AppTheme {
    static let backgroundGradient = LinearGradient(
        colors: [Color("FocusTop"), Color("FocusMid"), Color("FocusBottom")],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let cardGradient = LinearGradient(
        colors: [Color.white.opacity(0.9), Color.white.opacity(0.7)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let accent = Color("AccentColor")
}
