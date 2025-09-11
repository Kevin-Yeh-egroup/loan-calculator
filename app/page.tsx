import { LoanCalculator } from "@/components/loan-calculator"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 text-balance">月還款試算器</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            計算不同還款期限下的月付金額，了解如何規劃您的月度預算。支援單利、複利計算，包含寬限期和額外費用功能。
          </p>
        </div>
        <LoanCalculator />
      </div>
    </main>
  )
}
