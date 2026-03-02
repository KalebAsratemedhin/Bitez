import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutContent() {
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-12">
      <section className="space-y-6">
        <h1 className="text-4xl font-bold text-center">About Bitez</h1>
        <p className="text-lg text-center text-muted-foreground max-w-2xl mx-auto">
          Bitez is your all-in-one food ordering platform for restaurant owners and users.
        </p>
      </section>
      <section className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>For Restaurant Owners</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>Manage your restaurant with ease—upload menus, track orders, and engage with customers.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>For Users</CardTitle></CardHeader>
          <CardContent className="text-muted-foreground space-y-2">
            <p>Find your favorite dishes from top-rated local restaurants. Place orders and get timely deliveries.</p>
          </CardContent>
        </Card>
      </section>
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-center">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full max-w-3xl mx-auto">
          <AccordionItem value="faq-1">
            <AccordionTrigger>Is Bitez free to use?</AccordionTrigger>
            <AccordionContent>Yes, Bitez is free for users.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq-2">
            <AccordionTrigger>How do I register my restaurant?</AccordionTrigger>
            <AccordionContent>Sign up as a restaurant owner and follow the onboarding steps.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="faq-3">
            <AccordionTrigger>Can I track my orders?</AccordionTrigger>
            <AccordionContent>Yes, you can view order status in real-time.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
