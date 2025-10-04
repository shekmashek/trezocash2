import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, BarChart2, Layers, Users, ShieldCheck, ArrowRight, Plus, Minus, Star } from 'lucide-react';
import TrezocashLogo from './TrezocashLogo';

const FeatureCard = ({ icon: Icon, title, children }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
    <div className="flex items-center gap-4 mb-4">
      <div className="bg-blue-100 p-3 rounded-full">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm">{children}</p>
  </div>
);

const FaqItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-5 text-left">
        <span className="font-semibold text-gray-800">{question}</span>
        {isOpen ? <Minus className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-gray-500" />}
      </button>
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        className="overflow-hidden"
      >
        <p className="pb-5 text-gray-600">{answer}</p>
      </motion.div>
    </div>
  );
};

const BillingToggle = ({ billingCycle, setBillingCycle }) => (
    <div className="flex justify-center items-center gap-4 mb-10">
        <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-gray-500'}`}>
            Mensuel
        </span>
        <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className={`w-12 h-6 rounded-full p-1 flex items-center transition-colors bg-blue-600`}
        >
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 700, damping: 30 }}
                className="w-4 h-4 bg-white rounded-full"
                style={{ marginLeft: billingCycle === 'monthly' ? '0%' : 'calc(100% - 1rem)' }}
            />
        </button>
        <span className={`font-semibold transition-colors ${billingCycle === 'annual' ? 'text-blue-600' : 'text-gray-500'}`}>
            Annuel
        </span>
        <span className="px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full">
            -33% Économie
        </span>
    </div>
);

const LandingPage = ({ onSignUp }) => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const featuresList = [
      "Suivi de trésorerie complet", "Prévisions et Simulations (Scénarios)", "Analyse des données avancée",
      "Gestion multi-projets", "Consolidation des projets", "Support client prioritaire", "Toutes les futures mises à jour"
  ];

  const plans = [
      {
          id: 'solo',
          name: 'Pack Solo',
          description: 'Pour les indépendants et les budgets personnels.',
          monthly: { price: 12 },
          annual: { price: 96 },
          buttonText: "Démarrer l'essai de 14 jours",
      },
      {
          id: 'team',
          name: 'Pack Team',
          description: 'Pour les équipes et les entreprises qui collaborent.',
          monthly: { price: 20 },
          annual: { price: 160 },
          highlight: true,
          buttonText: "Démarrer l'essai de 14 jours",
      },
      {
          id: 'lifetime',
          name: 'Pack Lifetime',
          description: 'Un paiement unique, un accès à vie.',
          price: 499,
          special: true,
          buttonText: "Devenir un Visionnaire",
      }
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Pilotez votre trésorerie avec <span className="text-blue-600">sérénité</span>.
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Trezocash est l'outil tout-en-un qui transforme votre gestion financière. Anticipez, analysez et prenez les bonnes décisions, sans effort.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <button onClick={onSignUp} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-transform hover:scale-105 flex items-center gap-2">
                Démarrer l'essai gratuit <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Une vision à 360° sur vos finances</h2>
            <p className="mt-4 text-gray-600">Tout ce dont vous avez besoin pour une gestion proactive.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon={BarChart2} title="Prévisions Fiables">
              Anticipez vos soldes futurs avec une précision redoutable grâce à notre moteur de calcul avancé.
            </FeatureCard>
            <FeatureCard icon={Layers} title="Scénarios Illimités">
              Simulez l'impact d'un investissement, d'une embauche ou d'une crise. Prenez des décisions éclairées.
            </FeatureCard>
            <FeatureCard icon={Users} title="Collaboration Simplifiée">
              Partagez vos projets avec votre équipe ou votre expert-comptable en quelques clics, en toute sécurité.
            </FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Score Trézo Unique">
              Obtenez un diagnostic instantané de votre santé financière et des recommandations personnalisées.
            </FeatureCard>
            <FeatureCard icon={CheckCircle} title="Gestion de la TVA">
              Automatisez le calcul de votre TVA collectée et déductible pour des déclarations sans stress.
            </FeatureCard>
            <FeatureCard icon={TrezocashLogo} title="Analyse Intelligente">
              Identifiez vos postes de dépenses les plus importants et découvrez des opportunités d'optimisation.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="tarifs" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Des tarifs simples et transparents</h2>
            <p className="mt-4 text-gray-600">Choisissez le plan qui correspond à vos besoins. Sans engagement.</p>
          </div>
          
          <BillingToggle billingCycle={billingCycle} setBillingCycle={setBillingCycle} />

          <div className="flex flex-col lg:flex-row justify-center items-center lg:items-end gap-8">
            {plans.map(plan => {
              const buttonAction = onSignUp;

              return (
                plan.id === 'lifetime' ? (
                  <div key={plan.id} className={`w-full max-w-sm p-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl flex flex-col relative`}>
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-amber-900 bg-amber-400 rounded-full flex items-center gap-1"><Star className="w-4 h-4" /> Offre Visionnaire</div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-white text-center">{plan.name}</h3>
                      <p className="text-sm text-gray-300 mt-2 text-center h-10">{plan.description}</p>
                      <div className="my-8 h-28 flex flex-col justify-center text-center">
                        <span className="text-5xl font-extrabold text-white">{plan.price}€</span>
                        <span className="text-xl font-medium text-gray-400"> / à vie</span>
                      </div>
                    </div>
                    <div>
                      <button onClick={buttonAction} className="w-full px-6 py-3 font-semibold text-gray-900 bg-amber-400 rounded-lg hover:bg-amber-500 transition-colors shadow-lg flex items-center justify-center">
                        {plan.buttonText}
                      </button>
                      <p className="text-center text-xs text-amber-400 font-semibold mt-4 h-10 flex items-center justify-center">⚠️ Réservé aux 100 premiers visionnaires.</p>
                      <hr className="my-4 border-gray-700" />
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-300 font-bold">Collaboration illimitée</span></li>
                        {featuresList.map((feature, index) => (<li key={index} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-300">{feature}</span></li>))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div key={plan.id} className={`w-full max-w-sm p-8 bg-white rounded-2xl shadow-lg border flex flex-col relative ${plan.highlight ? 'border-2 border-blue-600 lg:scale-105' : ''}`}>
                    {plan.highlight && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 px-4 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">Le plus populaire</div>}
                    <div className="flex-grow">
                      <h3 className="text-xl font-semibold text-gray-800 text-center">{plan.name}</h3>
                      <p className="text-sm text-gray-500 mt-2 text-center h-10">{plan.description}</p>
                      <div className="my-8 h-28 flex flex-col justify-center text-center">
                        <AnimatePresence mode="wait">
                          <motion.div key={billingCycle} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}>
                            {billingCycle === 'monthly' ? (
                              <div>
                                <span className="text-5xl font-extrabold text-gray-900">{plan.monthly.price}€</span>
                                <span className="text-xl font-medium text-gray-500"> / mois</span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-5xl font-extrabold text-gray-900">{plan.annual.price}€</span>
                                <span className="text-xl font-medium text-gray-500"> / an</span>
                                {plan.id === 'solo' && <p className="text-sm font-semibold text-blue-600 mt-1">Soit 8€ par mois</p>}
                              </div>
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                    <div>
                      <button onClick={buttonAction} className={`w-full px-6 py-3 font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}>
                        {plan.buttonText}
                      </button>
                      <hr className="my-8" />
                      <ul className="space-y-3 text-sm">
                        {plan.id === 'team' && <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700 font-bold">Collaboration illimitée</span></li>}
                        {featuresList.map((feature, index) => (<li key={index} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-500" /><span className="text-gray-700">{feature}</span></li>))}
                      </ul>
                    </div>
                  </div>
                )
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Questions Fréquentes</h2>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <FaqItem
              question="À qui s'adresse Trezocash ?"
              answer="Trezocash est conçu pour les freelances, les TPE, les PME, les associations et même pour la gestion de budget personnel complexe. Si vous avez besoin d'anticiper vos flux de trésorerie, l'outil est fait pour vous."
            />
            <FaqItem
              question="Mes données sont-elles en sécurité ?"
              answer="Absolument. La sécurité est notre priorité. Toutes les connexions sont chiffrées et nous nous appuyons sur Supabase, une infrastructure sécurisée et reconnue, pour stocker vos données. Nous ne vendons ni ne partageons jamais vos informations."
            />
            <FaqItem
              question="Puis-je annuler mon abonnement à tout moment ?"
              answer="Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel, sans aucune justification. Vous conserverez l'accès à vos données jusqu'à la fin de la période de facturation en cours."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">Prêt à transformer votre gestion financière ?</h2>
          <p className="mt-4 text-blue-100 max-w-xl mx-auto">Rejoignez les centaines d'entrepreneurs et de particuliers qui ont retrouvé la sérénité grâce à une vision claire de leur trésorerie.</p>
          <div className="mt-8">
            <button onClick={onSignUp} className="px-8 py-4 font-semibold text-blue-600 bg-white rounded-lg shadow-xl hover:bg-gray-100 transition-transform hover:scale-105">
              Commencer mon essai gratuit de 14 jours
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
