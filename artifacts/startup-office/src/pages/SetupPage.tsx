import { useState } from 'react'
import { useLocation } from 'wouter'
import { useSetupApiKey } from '@workspace/api-client-react'
import { useSession } from '@/hooks/use-session'
import { GlassPanel } from '@/components/GlassPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Key, Loader2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function SetupPage() {
  const [, setLocation] = useLocation()
  const sessionId = useSession()
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState('')

  const { mutate: setupKey, isPending } = useSetupApiKey({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Setup complete",
          description: "API key verified successfully. Welcome to your office.",
        })
        setLocation('/')
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Setup failed",
          description: error.error || "Failed to configure API key. Please check and try again.",
        })
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!apiKey.trim()) return
    
    setupKey({
      data: {
        apiKey: apiKey.trim(),
        sessionId
      }
    })
  }

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/setup-bg.png)` }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <GlassPanel className="w-full max-w-md p-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 border border-primary/30">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground tracking-tight">
            Welcome to StartupHQ
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure your Claude API key to bring your AI employees to life.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              Anthropic API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-ant-api03-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono h-12"
              disabled={isPending}
              required
            />
            <p className="text-xs text-muted-foreground">
              Your key is securely stored in memory and used to power the agent conversations.
            </p>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold group" 
            disabled={!apiKey.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <>
                Initialize Office
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </GlassPanel>
    </div>
  )
}
