"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Calculator, RotateCcw, DollarSign, Percent, Calendar, Clock, Plus } from "lucide-react"

interface LoanCalculation {
  gracePeriodMonthlyPayment: number // 寬限期內月還款（僅利息）
  regularMonthlyPayment: number // 寬限期外月還款（本金+利息）
  totalPayment: number
  totalInterest: number
  totalCost: number
  gracePeriodInterest: number
  formula: string
  gracePeriodFormula: string // 寬限期計算公式
  regularPaymentFormula: string // 一般還款計算公式
}

export function LoanCalculator() {
  const [principal, setPrincipal] = useState<string>("")
  const [interestRate, setInterestRate] = useState<string>("")
  const [loanTerm, setLoanTerm] = useState<string>("")
  const [interestType, setInterestType] = useState<"simple" | "compound">("simple")
  const [hasGracePeriod, setHasGracePeriod] = useState(false)
  const [gracePeriodYears, setGracePeriodYears] = useState<string>("")
  const [gracePeriodMonths, setGracePeriodMonths] = useState<string>("")
  const [hasAdditionalFees, setHasAdditionalFees] = useState(false)
  const [processingFee, setProcessingFee] = useState<string>("")
  const [applicationFee, setApplicationFee] = useState<string>("")
  const [penaltyFee, setPenaltyFee] = useState<string>("")
  const [result, setResult] = useState<LoanCalculation | null>(null)

  useEffect(() => {
    calculateLoan()
  }, [
    principal,
    interestRate,
    loanTerm,
    interestType,
    hasGracePeriod,
    gracePeriodYears,
    gracePeriodMonths,
    processingFee,
    applicationFee,
    penaltyFee,
  ])

  const calculateLoan = () => {
    const P = Number.parseFloat(principal) || 0
    const r = (Number.parseFloat(interestRate) || 0) / 100
    const n = Number.parseFloat(loanTerm) || 0
    const gracePeriodYearsNum = hasGracePeriod ? Number.parseFloat(gracePeriodYears) || 0 : 0
    const gracePeriodMonthsNum = hasGracePeriod ? Number.parseFloat(gracePeriodMonths) || 0 : 0
    const totalGracePeriodYears = gracePeriodYearsNum + gracePeriodMonthsNum / 12
    const actualLoanTerm = n - totalGracePeriodYears

    if (P <= 0 || r < 0 || n <= 0) {
      setResult(null)
      return
    }

    let regularMonthlyPayment = 0
    let totalInterest = 0
    let gracePeriodInterest = 0
    let formula = ""
    let gracePeriodFormula = ""
    let regularPaymentFormula = ""

    const gracePeriodMonthlyPayment = hasGracePeriod && totalGracePeriodYears > 0 ? (P * r) / 12 : 0

    if (hasGracePeriod && totalGracePeriodYears > 0) {
      gracePeriodFormula = `寬限期月付金 = 本金 × 年利率 ÷ 12 = ${P.toLocaleString()} × ${(r * 100).toFixed(2)}% ÷ 12 = ${gracePeriodMonthlyPayment.toLocaleString()}`
      gracePeriodInterest = P * r * totalGracePeriodYears
    }

    if (actualLoanTerm <= 0) {
      setResult(null)
      return
    }

    if (interestType === "simple") {
      // 單利計算
      const actualLoanTermMonths = actualLoanTerm * 12
      const principalMonthlyPayment = P / actualLoanTermMonths // 本金月攤還
      const interestMonthlyPayment = (P * r) / 12 // 每月利息
      regularMonthlyPayment = principalMonthlyPayment + interestMonthlyPayment
      totalInterest = P * r * actualLoanTerm

      formula = `本利和 = 本金 + (本金 × 利率 × 期間) = ${P.toLocaleString()} + (${P.toLocaleString()} × ${(r * 100).toFixed(2)}% × ${actualLoanTerm}) = ${(P + totalInterest).toLocaleString()}`
      regularPaymentFormula = `寬限期後月還款 = 本金月攤還 + 月利息 = ${P.toLocaleString()} ÷ ${actualLoanTermMonths} + ${P.toLocaleString()} × ${(r * 100).toFixed(2)}% ÷ 12 = ${principalMonthlyPayment.toLocaleString()} + ${interestMonthlyPayment.toLocaleString()} = ${regularMonthlyPayment.toLocaleString()}`
    } else {
      // 複利計算 - 使用標準房貸公式
      const monthlyRate = r / 12
      const totalMonths = actualLoanTerm * 12

      if (monthlyRate > 0) {
        regularMonthlyPayment =
          (P * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
        totalInterest = regularMonthlyPayment * totalMonths - P
        formula = `本利和 = 本金 × (1 + 年利率)^期間 = ${P.toLocaleString()} × (1 + ${(r * 100).toFixed(2)}%)^${actualLoanTerm} = ${(regularMonthlyPayment * totalMonths).toLocaleString()}`
        regularPaymentFormula = `寬限期後月還款 = 本金 × [月利率 × (1+月利率)^總月數] ÷ [(1+月利率)^總月數 - 1] = ${P.toLocaleString()} × [${(monthlyRate * 100).toFixed(4)}% × (1+${(monthlyRate * 100).toFixed(4)}%)^${totalMonths}] ÷ [(1+${(monthlyRate * 100).toFixed(4)}%)^${totalMonths} - 1] = ${regularMonthlyPayment.toLocaleString()}`
      } else {
        regularMonthlyPayment = P / totalMonths
        totalInterest = 0
        formula = `無利息計算：月還款 = 本金 ÷ 總月數 = ${P.toLocaleString()} ÷ ${totalMonths} = ${regularMonthlyPayment.toLocaleString()}`
        regularPaymentFormula = formula
      }
    }

    // 計算額外費用
    const additionalFees =
      (Number.parseFloat(processingFee) || 0) +
      (Number.parseFloat(applicationFee) || 0) +
      (Number.parseFloat(penaltyFee) || 0)

    const totalPayment = regularMonthlyPayment * actualLoanTerm * 12 + gracePeriodInterest
    const totalCost = totalPayment + additionalFees

    setResult({
      gracePeriodMonthlyPayment: gracePeriodMonthlyPayment,
      regularMonthlyPayment: regularMonthlyPayment,
      totalPayment: totalPayment,
      totalInterest: totalInterest + gracePeriodInterest,
      totalCost: totalCost,
      gracePeriodInterest: gracePeriodInterest,
      formula: formula,
      gracePeriodFormula: gracePeriodFormula,
      regularPaymentFormula: regularPaymentFormula,
    })
  }

  const resetForm = () => {
    setPrincipal("")
    setInterestRate("")
    setLoanTerm("")
    setInterestType("simple")
    setHasGracePeriod(false)
    setGracePeriodYears("")
    setGracePeriodMonths("")
    setHasAdditionalFees(false)
    setProcessingFee("")
    setApplicationFee("")
    setPenaltyFee("")
    setResult(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("zh-TW", {
      style: "currency",
      currency: "TWD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 輸入表單 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Calculator className="h-5 w-5" />
            貸款資訊輸入
          </CardTitle>
          <CardDescription>請填入您的貸款相關資訊以計算月還款金額</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 本金 */}
          <div className="space-y-2">
            <Label htmlFor="principal" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              本金（元）
            </Label>
            <Input
              id="principal"
              type="number"
              placeholder="請輸入貸款本金"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              利率計算方式
            </Label>
            <Select value={interestType} onValueChange={(value: "simple" | "compound") => setInterestType(value)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">單利計算</SelectItem>
                <SelectItem value="compound">複利計算</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 年利率 */}
          <div className="space-y-2">
            <Label htmlFor="interestRate">年利率（%）</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.01"
              placeholder="請輸入年利率"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* 貸款期間 */}
          <div className="space-y-2">
            <Label htmlFor="loanTerm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              貸款期間（年）
            </Label>
            <Input
              id="loanTerm"
              type="number"
              placeholder="請輸入貸款年數"
              value={loanTerm}
              onChange={(e) => setLoanTerm(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* 寬限期設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="gracePeriod" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                寬限期設定
              </Label>
              <Switch id="gracePeriod" checked={hasGracePeriod} onCheckedChange={setHasGracePeriod} />
            </div>
            {hasGracePeriod && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodYears">年</Label>
                  <Input
                    id="gracePeriodYears"
                    type="number"
                    placeholder="0"
                    value={gracePeriodYears}
                    onChange={(e) => setGracePeriodYears(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gracePeriodMonths">月</Label>
                  <Input
                    id="gracePeriodMonths"
                    type="number"
                    placeholder="0"
                    max="11"
                    value={gracePeriodMonths}
                    onChange={(e) => setGracePeriodMonths(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* 額外費用 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="additionalFees" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                額外費用
              </Label>
              <Switch checked={hasAdditionalFees} onCheckedChange={setHasAdditionalFees} />
            </div>

            {hasAdditionalFees && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="processingFee">手續費（元）</Label>
                  <Input
                    id="processingFee"
                    type="number"
                    placeholder="0"
                    value={processingFee}
                    onChange={(e) => setProcessingFee(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationFee">申請處理費（元）</Label>
                  <Input
                    id="applicationFee"
                    type="number"
                    placeholder="0"
                    value={applicationFee}
                    onChange={(e) => setApplicationFee(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltyFee">逾期付款違約金（元）</Label>
                  <Input
                    id="penaltyFee"
                    type="number"
                    placeholder="0"
                    value={penaltyFee}
                    onChange={(e) => setPenaltyFee(e.target.value)}
                    className="bg-input border-border"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 重設按鈕 */}
          <div className="pt-4">
            <Button onClick={resetForm} variant="outline" className="w-full bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              重設
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 計算結果 */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">計算結果</CardTitle>
          <CardDescription>根據您輸入的資訊即時計算月還款詳細資訊</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-6">
              {hasGracePeriod && result.gracePeriodMonthlyPayment > 0 && (
                <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="text-center">
                    <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">寬限期內月還款（僅利息）</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {formatCurrency(result.gracePeriodMonthlyPayment)}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    {hasGracePeriod && result.gracePeriodMonthlyPayment > 0
                      ? "寬限期後月還款（本金+利息）"
                      : "每月還款金額"}
                  </p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(result.regularMonthlyPayment)}</p>
                </div>
              </div>

              {/* 詳細資訊 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">總還款金額</span>
                  <span className="font-semibold">{formatCurrency(result.totalPayment)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">總利息</span>
                  <span className="font-semibold">{formatCurrency(result.totalInterest)}</span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">總成本（含額外費用）</span>
                  <span className="font-semibold text-destructive">{formatCurrency(result.totalCost)}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* 寬限期計算公式 */}
                {hasGracePeriod && result.gracePeriodFormula && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-300">寬限期計算公式</h4>
                    <p className="text-sm text-orange-600 dark:text-orange-400 break-words">
                      {result.gracePeriodFormula}
                    </p>
                  </div>
                )}

                {/* 一般還款計算公式 */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-card-foreground">
                    {hasGracePeriod && result.gracePeriodMonthlyPayment > 0 ? "寬限期後還款計算公式" : "月還款計算公式"}
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground break-words">{result.formula}</p>
                    <p className="text-sm text-muted-foreground break-words">{result.regularPaymentFormula}</p>
                  </div>
                </div>
              </div>

              {/* 計算說明 */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-card-foreground">計算說明</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 使用{interestType === "simple" ? "單利" : "複利"}計算方式</li>
                  {hasGracePeriod && <li>• 寬限期內只需繳納利息，不需償還本金</li>}
                  {hasGracePeriod && <li>• 寬限期後開始償還本金加利息</li>}
                  <li>• 總成本包含所有額外費用</li>
                  <li>• 實際利率可能因銀行政策而有所不同</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">請填入貸款資訊，系統將即時計算結果</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
