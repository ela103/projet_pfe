import AIInsightToolContent from "./AIInsightToolContent"

export function generateStaticParams() {
  return [
    { tool: "global-analysis" },
    { tool: "traffic-diagnosis" },
    { tool: "recommendations" },
    { tool: "weak-pages" },
    { tool: "ga-analysis" },
    { tool: "gsc-analysis" },
    { tool: "ai-score" },
  ]
}

type PageProps = {
  params: Promise<{
    tool: string
  }>
}

export default async function AIInsightToolPage({ params }: PageProps) {
  const { tool } = await params

  return <AIInsightToolContent tool={tool} />
}