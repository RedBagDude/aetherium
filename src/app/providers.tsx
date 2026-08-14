'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { SmoothScrollProvider } from '@/components/animations/SmoothScrollProvider';
import { HeaderCommandPalette } from '@/components/dashboard/HeaderCommandPalette';
import { CustomCursor } from '@/components/animations/CustomCursor';
import { CommandMenu } from '@/components/ui/CommandMenu';
import { CopilotDrawer } from '@/components/ai/CopilotDrawer';

// WebGL layer is client-only (avoids SSR "window is not defined").
const BackgroundCanvas = dynamic(
  () => import('@/components/3d/BackgroundCanvas'),
  { ssr: false, loading: () => <div className="fixed inset-0 z-0 bg-bg-void" /> },
);

const FloatingNodes = dynamic(() => import('@/components/3d/FloatingNodes'), {
  ssr: false,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={client}>
      <SmoothScrollProvider>
        <BackgroundCanvas />
        <FloatingNodes />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
          style={{
            backgroundImage: "url('/textures/noise.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
        <CustomCursor />
        <HeaderCommandPalette />
        <CommandMenu />
        <main className="relative z-10 mx-auto max-w-[1600px] px-4 py-6 md:px-8">
          {children}
        </main>
        <CopilotDrawer />
      </SmoothScrollProvider>
    </QueryClientProvider>
  );
}
