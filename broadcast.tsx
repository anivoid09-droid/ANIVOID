import { useState } from "react";
import { useBroadcastMutations } from "@/hooks/use-admin-mutations";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Radio, AlertCircle } from "lucide-react";

export default function Broadcast() {
  const { send } = useBroadcastMutations();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message) return;
    if (confirm("WARNING: This will instantly send a message to ALL registered groups. Proceed?")) {
      send.mutate({ data: { message } }, { onSuccess: () => setMessage("") });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader 
        title="Global Broadcast" 
        description="Send an instant push notification to all groups where the bot is active."
      />

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="flex items-start gap-4 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive-foreground">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-bold mb-1">Use with Caution</p>
            <p className="opacity-90">Broadcasts go out immediately to the Telegram API. To avoid rate limits, the bot handles staggered sending automatically, but you should still avoid spamming.</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Broadcast Message</label>
          <Textarea 
            className="min-h-[200px] bg-background/50 border-white/10 font-mono text-sm"
            placeholder="🔥 MASSIVE RAID BOSS DETECTED! Use /raid to join the fight!..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <Button 
          className="w-full bg-primary hover:bg-primary/80 h-12 text-lg shadow-lg shadow-primary/20"
          disabled={!message || send.isPending}
          onClick={handleSend}
        >
          <Radio className="w-5 h-5 mr-2" />
          {send.isPending ? "Transmitting..." : "Send to All Groups"}
        </Button>
      </div>
    </div>
  );
}
