
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const TEST_MODE_KEY = 'note-drop-test-orientation';

interface TestSettings {
  enabled: boolean;
  alpha: number;
  beta: number;
  gamma: number;
}

export function TestModeTab() {
  const [settings, setSettings] = useState<TestSettings>({
    enabled: false,
    alpha: 0,
    beta: 90,
    gamma: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(TEST_MODE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.warn("Could not load test settings from localStorage", e);
    }
  }, []);

  const updateSetting = (key: keyof TestSettings, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      try {
        localStorage.setItem(TEST_MODE_KEY, JSON.stringify(newSettings));
      } catch (e) {
        console.error("Failed to save test settings", e);
        toast({
          title: "Error Saving Settings",
          description: "Could not save test settings to local storage.",
          variant: "destructive"
        });
      }
      return newSettings;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Simulation</CardTitle>
        <CardDescription>
          Override device sensors for testing features like the compass on a desktop.
          Refresh the page to see changes take effect.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <h3 className="font-medium">Enable Test Mode</h3>
            <p className="text-sm text-muted-foreground">
              Override real device orientation with simulated values.
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        <fieldset disabled={!settings.enabled} className="space-y-6 disabled:opacity-50">
          <div>
            <Label htmlFor="alpha">Alpha (Compass Heading: {settings.alpha.toFixed(0)}°)</Label>
            <Slider
              id="alpha"
              min={0}
              max={360}
              step={1}
              value={[settings.alpha]}
              onValueChange={([v]) => updateSetting('alpha', v)}
            />
          </div>
          <div>
            <Label htmlFor="beta">Beta (Front/Back Tilt: {settings.beta.toFixed(0)}°)</Label>
            <Slider
              id="beta"
              min={-180}
              max={180}
              step={1}
              value={[settings.beta]}
              onValueChange={([v]) => updateSetting('beta', v)}
            />
          </div>
          <div>
            <Label htmlFor="gamma">Gamma (Left/Right Tilt: {settings.gamma.toFixed(0)}°)</Label>
            <Slider
              id="gamma"
              min={-90}
              max={90}
              step={1}
              value={[settings.gamma]}
              onValueChange={([v]) => updateSetting('gamma', v)}
            />
          </div>
        </fieldset>
      </CardContent>
    </Card>
  );
}
