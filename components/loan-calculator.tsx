"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calculator, RotateCcw, DollarSign, Percent, Calendar, Clock, Plus, HelpCircle, ChevronDown, ChevronUp, AlertCircle, Sparkles } from "lucide-react"

interface PaymentDetail {
  period: number // 期數
  principal: number // 本金
  interest: number // 利息
  remainingPrincipal: number // 剩餘本金
}

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
  paymentDetails: PaymentDetail[] // 還款明細
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
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [errors, setErrors] = useState<{
    principal?: string
    interestRate?: string
    loanTerm?: string
    gracePeriod?: string
  }>({})

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
    // 驗證輸入
    const newErrors: typeof errors = {}
    const P = Number.parseFloat(principal) || 0
    const r = (Number.parseFloat(interestRate) || 0) / 100
    const n = Number.parseFloat(loanTerm) || 0
    const gracePeriodYearsNum = hasGracePeriod ? Number.parseFloat(gracePeriodYears) || 0 : 0
    const gracePeriodMonthsNum = hasGracePeriod ? Number.parseFloat(gracePeriodMonths) || 0 : 0
    const totalGracePeriodMonths = gracePeriodYearsNum * 12 + gracePeriodMonthsNum
    const totalGracePeriodYears = gracePeriodYearsNum + gracePeriodMonthsNum / 12
    const totalLoanMonths = n * 12
    const actualLoanTerm = n - totalGracePeriodYears

    // 驗證本金
    if (principal && P <= 0) {
      newErrors.principal = "本金必須大於 0"
    }

    // 驗證年利率
    if (interestRate) {
      const rate = Number.parseFloat(interestRate)
      if (isNaN(rate) || rate < 0) {
        newErrors.interestRate = "請輸入有效利率"
      } else if (rate === 0) {
        newErrors.interestRate = "利率不可為 0"
      } else if (rate > 99) {
        newErrors.interestRate = "利率不可超過 99%"
      }
    }

    // 驗證貸款期間
    if (loanTerm && n <= 0) {
      newErrors.loanTerm = "貸款期間必須大於 0"
    }

    // 驗證寬限期
    if (hasGracePeriod && totalGracePeriodMonths > 0) {
      if (totalGracePeriodMonths >= totalLoanMonths) {
        newErrors.gracePeriod = "寬限期不可大於或等於貸款期間"
      }
    }

    setErrors(newErrors)

    if (P <= 0 || r < 0 || n <= 0 || Object.keys(newErrors).length > 0) {
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

    // 計算還款明細
    const paymentDetails: PaymentDetail[] = []
    let remainingPrincipal = P
    const actualLoanTermMonths = actualLoanTerm * 12

    // 寬限期期間（僅利息）
    if (hasGracePeriod && totalGracePeriodMonths > 0) {
      for (let i = 1; i <= totalGracePeriodMonths; i++) {
        const interest = (remainingPrincipal * r) / 12
        paymentDetails.push({
          period: i,
          principal: 0,
          interest: interest,
          remainingPrincipal: remainingPrincipal,
        })
      }
    }

    // 正常還款期間（本金+利息）
    if (interestType === "simple") {
      // 單利：每期本金固定，利息基於原始本金
      const principalMonthlyPayment = P / actualLoanTermMonths
      const interestMonthlyPayment = (P * r) / 12 // 單利：利息基於原始本金
      for (let i = 1; i <= actualLoanTermMonths; i++) {
        remainingPrincipal -= principalMonthlyPayment
        paymentDetails.push({
          period: totalGracePeriodMonths + i,
          principal: principalMonthlyPayment,
          interest: interestMonthlyPayment,
          remainingPrincipal: Math.max(0, remainingPrincipal),
        })
      }
    } else {
      // 複利：每期還款固定，本金遞增
      for (let i = 1; i <= actualLoanTermMonths; i++) {
        const interest = (remainingPrincipal * r) / 12
        const principal = regularMonthlyPayment - interest
        remainingPrincipal -= principal
        paymentDetails.push({
          period: totalGracePeriodMonths + i,
          principal: principal,
          interest: interest,
          remainingPrincipal: Math.max(0, remainingPrincipal),
        })
      }
    }

    const totalPayment = regularMonthlyPayment * actualLoanTermMonths + gracePeriodInterest
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
      paymentDetails: paymentDetails,
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
    setErrors({})
    setShowPaymentDetails(false)
  }

  // 處理數字輸入（支援小數點、複製貼上）
  const handleNumberInput = (
    value: string,
    setter: (value: string) => void,
    allowDecimal: boolean = false
  ) => {
    // 允許空字串、數字、小數點
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (allowDecimal) {
        setter(value)
      } else {
        // 不允許小數點的情況（如本金、期數）
        if (!value.includes(".")) {
          setter(value)
        }
      }
    }
  }

  // 載入範例
  const loadExample = (example: number) => {
    resetForm()
    switch (example) {
      case 1:
        // 單利/複利比較範例
        setPrincipal("100000")
        setInterestRate("5")
        setLoanTerm("1")
        setInterestType("simple")
        break
      case 2:
        // 一般信用貸款
        setPrincipal("300000")
        setInterestRate("2.75")
        setLoanTerm("3")
        setInterestType("compound")
        break
      case 3:
        // 有寬限期的貸款
        setPrincipal("500000")
        setInterestRate("2")
        setLoanTerm("4")
        setHasGracePeriod(true)
        setGracePeriodMonths("6")
        setInterestType("compound")
        break
      case 4:
        // 含手續費的貸款
        setPrincipal("200000")
        setInterestRate("3")
        setLoanTerm("2")
        setHasAdditionalFees(true)
        setProcessingFee("3000")
        break
    }
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
    <div className="max-w-6xl mx-auto">
      {/* 使用範例指引 */}
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            快速範例
          </CardTitle>
          <CardDescription>點擊下方範例快速填入資料</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={() => loadExample(1)}
              className="bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            >
              範例 1：單利比較
            </Button>
            <Button
              variant="outline"
              onClick={() => loadExample(2)}
              className="bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            >
              範例 2：一般信用貸款
            </Button>
            <Button
              variant="outline"
              onClick={() => loadExample(3)}
              className="bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            >
              範例 3：有寬限期
            </Button>
            <Button
              variant="outline"
              onClick={() => loadExample(4)}
              className="bg-white dark:bg-card hover:bg-blue-50 dark:hover:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            >
              範例 4：含手續費
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                type="text"
                inputMode="numeric"
                placeholder="請輸入貸款本金"
                value={principal}
                onChange={(e) => handleNumberInput(e.target.value, setPrincipal)}
                onPaste={(e) => {
                  e.preventDefault()
                  const pasted = e.clipboardData.getData("text")
                  if (/^\d+$/.test(pasted)) {
                    setPrincipal(pasted)
                  }
                }}
                className={`bg-input border-border ${errors.principal ? "border-destructive" : ""}`}
              />
              {errors.principal && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.principal}
                </p>
              )}
            </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              利率計算方式
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">
                    {interestType === "simple" ? "單利計算" : "複利計算"}
                  </p>
                  <p className="text-xs">
                    {interestType === "simple"
                      ? "每期利息固定，以原始本金計算。適合短期貸款。"
                      : "每期利息依剩餘本金計算，本金遞減，利息也遞減。適合長期貸款（如房貸）。"}
                  </p>
                </TooltipContent>
              </Tooltip>
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
              type="text"
              inputMode="decimal"
              placeholder="例如：2.75、1.88"
              value={interestRate}
              onChange={(e) => handleNumberInput(e.target.value, setInterestRate, true)}
              onPaste={(e) => {
                e.preventDefault()
                const pasted = e.clipboardData.getData("text")
                if (/^\d*\.?\d*$/.test(pasted)) {
                  setInterestRate(pasted)
                }
              }}
              className={`bg-input border-border ${errors.interestRate ? "border-destructive" : ""}`}
            />
            {errors.interestRate && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.interestRate}
              </p>
            )}
            <p className="text-xs text-muted-foreground">支援小數點輸入，例如：1.5%、2.75%</p>
          </div>

          {/* 貸款期間 */}
          <div className="space-y-2">
            <Label htmlFor="loanTerm" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              貸款期間（年）
            </Label>
            <Input
              id="loanTerm"
              type="text"
              inputMode="numeric"
              placeholder="請輸入貸款年數"
              value={loanTerm}
              onChange={(e) => handleNumberInput(e.target.value, setLoanTerm)}
              onPaste={(e) => {
                e.preventDefault()
                const pasted = e.clipboardData.getData("text")
                if (/^\d+$/.test(pasted)) {
                  setLoanTerm(pasted)
                }
              }}
              className={`bg-input border-border ${errors.loanTerm ? "border-destructive" : ""}`}
            />
            {errors.loanTerm && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.loanTerm}
              </p>
            )}
          </div>

          {/* 寬限期設定 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label htmlFor="gracePeriod" className="flex items-center gap-2 cursor-pointer">
                  <Clock className="h-4 w-4" />
                  寬限期設定
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-semibold mb-1">寬限期說明</p>
                    <p className="text-xs">
                      寬限期內只需支付利息，不需償還本金。寬限期結束後，才開始償還本金加利息。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                id="gracePeriod"
                checked={hasGracePeriod}
                onCheckedChange={setHasGracePeriod}
                className="data-[state=checked]:bg-slate-800 dark:data-[state=checked]:bg-slate-700 data-[state=checked]:shadow-lg data-[state=checked]:shadow-slate-900/50 data-[state=unchecked]:bg-muted data-[state=unchecked]:shadow-md ring-2 ring-offset-2 ring-offset-background data-[state=checked]:ring-slate-600/30"
                thumbClassName="bg-slate-200 dark:bg-slate-300 data-[state=checked]:bg-white shadow-sm"
              />
            </div>
            {hasGracePeriod && (
              <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriodYears">年</Label>
                    <Input
                      id="gracePeriodYears"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={gracePeriodYears}
                      onChange={(e) => handleNumberInput(e.target.value, setGracePeriodYears)}
                      className={`bg-input border-border ${errors.gracePeriod ? "border-destructive" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriodMonths">月（單位：月）</Label>
                    <Input
                      id="gracePeriodMonths"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={gracePeriodMonths}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === "" || /^\d+$/.test(val)) {
                          const num = parseInt(val) || 0
                          if (num <= 11) {
                            setGracePeriodMonths(val)
                          }
                        }
                      }}
                      className={`bg-input border-border ${errors.gracePeriod ? "border-destructive" : ""}`}
                    />
                  </div>
                </div>
                {errors.gracePeriod && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{errors.gracePeriod}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* 額外費用 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
              <Label htmlFor="additionalFees" className="flex items-center gap-2 cursor-pointer font-medium">
                <Plus className="h-4 w-4 text-primary" />
                額外費用
              </Label>
              <Switch
                id="additionalFees"
                checked={hasAdditionalFees}
                onCheckedChange={setHasAdditionalFees}
                className="data-[state=checked]:bg-slate-800 dark:data-[state=checked]:bg-slate-700 data-[state=checked]:shadow-lg data-[state=checked]:shadow-slate-900/50 data-[state=unchecked]:bg-muted data-[state=unchecked]:shadow-md ring-2 ring-offset-2 ring-offset-background data-[state=checked]:ring-slate-600/30"
                thumbClassName="bg-slate-200 dark:bg-slate-300 data-[state=checked]:bg-white shadow-sm"
              />
            </div>

            {hasAdditionalFees && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="processingFee">手續費（元）</Label>
                  <Input
                    id="processingFee"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={processingFee}
                    onChange={(e) => handleNumberInput(e.target.value, setProcessingFee)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationFee">申請處理費（元）</Label>
                  <Input
                    id="applicationFee"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={applicationFee}
                    onChange={(e) => handleNumberInput(e.target.value, setApplicationFee)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="penaltyFee">逾期付款違約金（元）</Label>
                  <Input
                    id="penaltyFee"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={penaltyFee}
                    onChange={(e) => handleNumberInput(e.target.value, setPenaltyFee)}
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

              {/* 還款明細 */}
              <Collapsible open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>顯示還款明細</span>
                    {showPaymentDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2 text-sm font-semibold pb-2 border-b border-border">
                        <div>期數</div>
                        <div className="text-right">本金</div>
                        <div className="text-right">利息</div>
                        <div className="text-right">本期還款</div>
                        <div className="text-right">剩餘本金</div>
                      </div>
                      {result.paymentDetails.map((detail, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-5 gap-2 text-sm py-1 border-b border-border/50"
                        >
                          <div className="font-medium">第 {detail.period} 期</div>
                          <div className="text-right">{formatCurrency(detail.principal)}</div>
                          <div className="text-right text-muted-foreground">
                            {formatCurrency(detail.interest)}
                          </div>
                          <div className="text-right font-semibold">
                            {formatCurrency(detail.principal + detail.interest)}
                          </div>
                          <div className="text-right text-muted-foreground">
                            {formatCurrency(detail.remainingPrincipal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
    </div>
  )
}
