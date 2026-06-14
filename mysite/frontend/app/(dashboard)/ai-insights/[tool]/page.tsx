import AIInsightToolContent from "./AIInsightToolContent"

export function generateStaticParams() {
  return [
    { tool: "global-analysis" },
    { tool: "traffic-diagnosis" },
    { tool: "weak-pages" },
    { tool: "ga-analysis" },
    { tool: "gsc-analysis" },
    
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