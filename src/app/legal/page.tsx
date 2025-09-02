import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function LegalPage() {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-4xl font-headline font-bold mb-8">Legal Information</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-headline">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Welcome to NoteDrop! By using our service, you agree to these terms. Please read them carefully.</p>
          <p><strong>1. Your Content:</strong> You retain ownership of content you post, but you grant us a license to display it. You are responsible for your content and must ensure it complies with our policies.</p>
          <p><strong>2. Responsible Use:</strong> Do not use NoteDrop to engage in illegal activities, harass others, or post harmful content. Always be aware of your surroundings; do not trespass or use the app while driving.</p>
          <p><strong>3. Service Availability:</strong> Our services are provided "as is." We may modify or terminate our services at any time.</p>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-headline">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>Your privacy is important to us.</p>
          <p><strong>1. Location Data:</strong> We use your location to provide core app functionality. We do not store your precise historical location trails. Note locations are stored, but fuzzed for public display.</p>
          <p><strong>2. Account Information:</strong> If you sign in with Google, we store your basic profile information. Anonymous users are identified by a temporary ID.</p>
          <p><strong>3. Data Sharing:</strong> We do not sell your personal data to third parties.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Attribution &amp; Safety</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
            <p><strong>Map Data:</strong> Map tiles are provided by OpenStreetMap. &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors.</p>
            <p><strong>Safety Notice:</strong> Be a good neighbor. Respect private property and be mindful of your surroundings. Your safety is your own responsibility. Do not enter dangerous areas or use the app in a way that distracts you from traffic.</p>
        </CardContent>
      </Card>
    </div>
  );
}
