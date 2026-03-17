import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdateUser,
  useDeleteGroup,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
  useCreateCard,
  useUpdateCard,
  useDeleteCard,
  useCreateAd,
  useUpdateAd,
  useDeleteAd,
  useToggleAd,
  useCreateTournament,
  useDeleteTournament,
  useUpdateTournamentStatus,
  useAddMarketItem,
  useRemoveMarketItem,
  useSendBroadcast,
  getListUsersQueryKey,
  getListGroupsQueryKey,
  getListCharactersQueryKey,
  getListCardsQueryKey,
  getListAdsQueryKey,
  getListTournamentsQueryKey,
  getListMarketItemsQueryKey,
} from "@workspace/api-client-react";

// Centralized wrapper hooks to automatically invalidate queries and show toasts

export function useUserMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const update = useUpdateUser({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
        toast({ title: "User updated successfully" });
      },
      onError: (err: any) => toast({ title: "Error updating user", description: err.message, variant: "destructive" })
    }
  });

  return { update };
}

export function useGroupMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const remove = useDeleteGroup({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        toast({ title: "Group removed successfully" });
      },
      onError: (err: any) => toast({ title: "Error removing group", description: err.message, variant: "destructive" })
    }
  });

  return { remove };
}

export function useCharacterMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCharactersQueryKey() });

  const create = useCreateCharacter({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Character created" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });
  
  const update = useUpdateCharacter({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Character updated" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  const remove = useDeleteCharacter({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Character deleted" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  return { create, update, remove };
}

export function useCardMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListCardsQueryKey() });

  const create = useCreateCard({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Card created" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });
  
  const update = useUpdateCard({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Card updated" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  const remove = useDeleteCard({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Card deleted" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  return { create, update, remove };
}

export function useAdMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAdsQueryKey() });

  const create = useCreateAd({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Ad created" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });
  
  const update = useUpdateAd({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Ad updated" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  const toggle = useToggleAd({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Ad status toggled" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  const remove = useDeleteAd({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Ad deleted" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  return { create, update, toggle, remove };
}

export function useTournamentMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListTournamentsQueryKey() });

  const create = useCreateTournament({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Tournament created" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });
  
  const updateStatus = useUpdateTournamentStatus({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Status updated" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  const remove = useDeleteTournament({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Tournament deleted" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  return { create, updateStatus, remove };
}

export function useMarketMutations() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => qc.invalidateQueries({ queryKey: getListMarketItemsQueryKey() });

  const add = useAddMarketItem({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Item added to market" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  const remove = useRemoveMarketItem({
    mutation: {
      onSuccess: () => { invalidate(); toast({ title: "Item removed" }); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  return { add, remove };
}

export function useBroadcastMutations() {
  const { toast } = useToast();

  const send = useSendBroadcast({
    mutation: {
      onSuccess: (data) => { 
        toast({ 
          title: "Broadcast Sent", 
          description: `Sent to ${data.sent} groups. Failed: ${data.failed}` 
        }); 
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  });

  return { send };
}
