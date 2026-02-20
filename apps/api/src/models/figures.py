from .schemas import Figure, FigureInfo, DebateTopic


MACHIAVELLI_TOPICS = [
    DebateTopic(
        id="fear_vs_love",
        title="Is it better to be feared than loved?",
        description="Explore Machiavelli's famous argument about political power and human nature.",
        prompt_hint="Focus on fear vs. love and the prince's security, not general power.",
    ),
    DebateTopic(
        id="promises",
        title="Should a ruler keep their promises?",
        description="Debate the ethics of political promises and when deception is justified.",
    ),
    DebateTopic(
        id="virtue_power",
        title="Can virtue and power coexist?",
        description="Discuss whether moral virtue is compatible with effective political leadership.",
    ),
    DebateTopic(
        id="ends_means",
        title="Does the end justify the means?",
        description="Examine the moral implications of pragmatic political action.",
    ),
    DebateTopic(
        id="generosity",
        title="Is it better to be stingy or generous?",
        description="Debate Machiavelli's counterintuitive advice about liberality.",
    ),
]

SOCRATES_TOPICS = [
    DebateTopic(
        id="breaking_law",
        title="Is it ever right to break the law?",
        description="Explore Socrates' arguments about obedience to the state and individual conscience.",
        prompt_hint="Focus on Crito and the Laws—obedience vs. conscience.",
    ),
    DebateTopic(
        id="examined_life",
        title="Is the unexamined life worth living?",
        description="Discuss the value of philosophical self-reflection and the pursuit of wisdom.",
    ),
    DebateTopic(
        id="virtue_teachable",
        title="Can virtue be taught?",
        description="Debate whether moral excellence can be learned or is innate.",
    ),
    DebateTopic(
        id="what_is_justice",
        title="What is justice?",
        description="Explore the Socratic quest to define justice through dialectic.",
    ),
    DebateTopic(
        id="fear_death",
        title="Should we fear death?",
        description="Discuss Socrates' arguments about death, the soul, and the philosopher's task.",
    ),
]

EPICTETUS_TOPICS = [
    DebateTopic(
        id="control",
        title="Can we truly control anything?",
        description="Explore Epictetus's fundamental distinction between what is in our power and what is not.",
        prompt_hint="Emphasize the dichotomy of control—what is up to us vs. not.",
    ),
    DebateTopic(
        id="freedom",
        title="What does it mean to be free?",
        description="Debate Epictetus's Stoic definition of freedom as mastery over one's own judgments.",
    ),
    DebateTopic(
        id="adversity",
        title="Is adversity necessary for growth?",
        description="Discuss the Stoic view that challenges and hardships are opportunities for virtue.",
    ),
    DebateTopic(
        id="acceptance",
        title="Should we accept what we cannot change?",
        description="Explore Epictetus's teaching on the art of acceptance and the dichotomy of control.",
    ),
    DebateTopic(
        id="discipline",
        title="Is self-discipline the path to happiness?",
        description="Debate the role of discipline and training in achieving a good life.",
    ),
]

MILL_TOPICS = [
    DebateTopic(
        id="liberty",
        title="Should there be limits to individual liberty?",
        description="Debate Mill's harm principle and the boundaries of individual freedom.",
    ),
    DebateTopic(
        id="speech",
        title="Is free speech an absolute?",
        description="Explore Mill's arguments for unrestricted freedom of expression.",
    ),
    DebateTopic(
        id="majority",
        title="Can the majority tyranny?",
        description="Discuss Mill's concern about the tyranny of the majority in democratic societies.",
    ),
    DebateTopic(
        id="individual_society",
        title="Individual vs. Society: Who matters more?",
        description="Debate the relationship between individual autonomy and social welfare.",
    ),
    DebateTopic(
        id="utility",
        title="Is happiness the ultimate goal?",
        description="Explore Mill's utilitarian philosophy and the principle of greatest happiness.",
    ),
]

AURELIUS_TOPICS = [
    DebateTopic(
        id="death",
        title="Should we fear death?",
        description="Explore Marcus Aurelius's Stoic reflections on mortality and the acceptance of death.",
    ),
    DebateTopic(
        id="duty",
        title="What do we owe to others?",
        description="Discuss the Emperor's thoughts on duty, service, and responsibility.",
    ),
    DebateTopic(
        id="adversity",
        title="How should we face adversity?",
        description="Explore Marcus Aurelius's teachings on responding to hardship with reason.",
    ),
    DebateTopic(
        id="self",
        title="Who are we really?",
        description="Debate the Stoic view of the self and the nature of consciousness.",
    ),
    DebateTopic(
        id="impermanence",
        title="Why embrace impermanence?",
        description="Discuss the Buddhist/Stoic insight that everything flows and changes.",
    ),
]

LOCKE_TOPICS = [
    DebateTopic(
        id="rights",
        title="What are natural rights?",
        description="Explore Locke's theory of natural rights and the state of nature.",
    ),
    DebateTopic(
        id="property",
        title="What gives us the right to property?",
        description="Debate Locke's labor theory of property and the origins of ownership.",
    ),
    DebateTopic(
        id="government",
        title="Why do we need government?",
        description="Explore Locke's social contract theory and the purpose of civil government.",
    ),
    DebateTopic(
        id="consent",
        title="Does government require consent?",
        description="Discuss the role of consent in legitimate governance.",
    ),
    DebateTopic(
        id="revolution",
        title="When is revolution justified?",
        description="Explore Locke's conditions for the right to overthrow a government.",
    ),
]

ROUSSEAU_TOPICS = [
    DebateTopic(
        id="freedom",
        title="Are humans naturally free?",
        description="Explore Rousseau's concept of natural freedom and the social contract.",
    ),
    DebateTopic(
        id="general_will",
        title="What is the general will?",
        description="Debate Rousseau's central concept and its implications for democracy.",
    ),
    DebateTopic(
        id="society_corrupts",
        title="Does society corrupt humanity?",
        description="Discuss the paradox of civilization and the noble savage.",
    ),
    DebateTopic(
        id="equality",
        title="Is equality possible?",
        description="Explore Rousseau's views on natural vs. civil inequality.",
    ),
    DebateTopic(
        id="democracy",
        title="What is true democracy?",
        description="Debate Rousseau's conception of popular sovereignty.",
    ),
]

NIETZSCHE_TOPICS = [
    DebateTopic(
        id="morality",
        title="Is morality relative?",
        description="Explore Nietzsche's critique of traditional morality and master/slave morality.",
    ),
    DebateTopic(
        id="truth",
        title="Is there objective truth?",
        description="Debate Nietzsche's perspectivism and the rejection of absolute truth.",
    ),
    DebateTopic(
        id="power",
        title="Is power the foundation of morality?",
        description="Discuss the will to power and its relationship to values.",
    ),
    DebateTopic(
        id="meaning",
        title="Can life have meaning without God?",
        description="Explore Nietzsche's affirmation of life and the Übermensch.",
    ),
    DebateTopic(
        id="affirmation",
        title="Should we affirm life completely?",
        description="Discuss amor fati and the eternal recurrence.",
    ),
]

HOBBES_TOPICS = [
    DebateTopic(
        id="power",
        title="Is power the foundation of society?",
        description="Explore Hobbes's materialist view of human nature and the pursuit of power.",
    ),
    DebateTopic(
        id="sovereign",
        title="Do we need absolute authority?",
        description="Debate Hobbes's argument for the sovereign and the social contract.",
    ),
    DebateTopic(
        id="fear",
        title="Is fear the basis of order?",
        description="Discuss how Hobbes views fear as the foundation of political obligation.",
    ),
    DebateTopic(
        id="freedom",
        title="Are we ever truly free?",
        description="Explore Hobbes's conception of liberty within the commonwealth.",
    ),
    DebateTopic(
        id="nature",
        title="What is the state of nature?",
        description="Debate the war of all against all and the condition of mankind without government.",
    ),
]

PLATO_TOPICS = [
    DebateTopic(
        id="justice",
        title="What is justice?",
        description="Explore Plato's conception of justice in the soul and the city from the Republic.",
        prompt_hint="Focus on the tripartite soul and the parallel between just person and just city.",
    ),
    DebateTopic(
        id="philosopher_kings",
        title="Should philosophers rule?",
        description="Debate Plato's argument that only those who know the Good are fit to govern.",
    ),
    DebateTopic(
        id="forms",
        title="Is there a higher reality beyond the senses?",
        description="Discuss Plato's Theory of Forms and the allegory of the cave.",
    ),
    DebateTopic(
        id="democracy_critique",
        title="Is democracy a flawed system?",
        description="Examine Plato's critique that democracy degenerates into tyranny.",
    ),
    DebateTopic(
        id="knowledge_virtue",
        title="Is virtue the same as knowledge?",
        description="Debate whether moral failings are always failures of understanding.",
    ),
]

ARISTOTLE_TOPICS = [
    DebateTopic(
        id="eudaimonia",
        title="What is the good life?",
        description="Explore Aristotle's concept of eudaimonia—flourishing as the highest human good.",
        prompt_hint="Focus on the function argument and virtue as activity, not just disposition.",
    ),
    DebateTopic(
        id="virtue_mean",
        title="Is virtue a mean between extremes?",
        description="Debate Aristotle's doctrine of the mean and its application to character.",
    ),
    DebateTopic(
        id="friendship",
        title="Why is friendship essential for a good life?",
        description="Discuss Aristotle's three kinds of friendship and the role of philia in flourishing.",
    ),
    DebateTopic(
        id="politics_nature",
        title="Is man naturally a political animal?",
        description="Examine Aristotle's claim that the polis is natural and humans cannot flourish outside it.",
    ),
    DebateTopic(
        id="knowledge_experience",
        title="Does knowledge come from experience?",
        description="Contrast Aristotle's empiricism with Plato's rationalism.",
    ),
]

HUME_TOPICS = [
    DebateTopic(
        id="causation",
        title="Can we ever know cause and effect?",
        description="Explore Hume's skeptical argument that causation is habit, not necessity.",
        prompt_hint="Focus on the problem of induction and custom vs. rational inference.",
    ),
    DebateTopic(
        id="morality_feeling",
        title="Is morality based on reason or feeling?",
        description="Debate Hume's claim that reason is the slave of the passions in moral judgment.",
    ),
    DebateTopic(
        id="self",
        title="Does the self exist?",
        description="Discuss Hume's bundle theory—the self as a collection of perceptions, not a unified entity.",
    ),
    DebateTopic(
        id="miracles",
        title="Should we believe in miracles?",
        description="Examine Hume's argument that testimony for miracles is never sufficient evidence.",
    ),
    DebateTopic(
        id="is_ought",
        title="Can we derive 'ought' from 'is'?",
        description="Debate Hume's is-ought problem and the limits of natural-law ethics.",
    ),
]

KANT_TOPICS = [
    DebateTopic(
        id="categorical_imperative",
        title="Should we act only on universalizable principles?",
        description="Explore Kant's categorical imperative and the test of universalizability.",
        prompt_hint="Focus on the Formula of Universal Law and what makes a maxim contradictory when universalized.",
    ),
    DebateTopic(
        id="duty_consequences",
        title="Does morality depend on consequences?",
        description="Debate Kant's deontological claim that right action is about duty, not outcomes.",
    ),
    DebateTopic(
        id="humanity_as_end",
        title="Should we treat people as ends, never merely as means?",
        description="Examine the Formula of Humanity and what it demands in practice.",
    ),
    DebateTopic(
        id="free_will",
        title="Can free will and determinism coexist?",
        description="Discuss Kant's compatibilism between the noumenal free will and the phenomenal causal order.",
    ),
    DebateTopic(
        id="limits_of_reason",
        title="What can reason tell us about God and the soul?",
        description="Explore Kant's critique of metaphysical speculation about God, freedom, and immortality.",
    ),
]

WOLLSTONECRAFT_TOPICS = [
    DebateTopic(
        id="equal_education",
        title="Should women receive the same education as men?",
        description="Explore Wollstonecraft's central argument that denying women rational education is unjust.",
        prompt_hint="Focus on the argument that women's apparent weakness is caused by education, not nature.",
    ),
    DebateTopic(
        id="reason_vs_sentiment",
        title="Is sentiment a reliable guide to virtue?",
        description="Debate Wollstonecraft's critique of sentiment-based morality and Rousseau's view of women.",
    ),
    DebateTopic(
        id="rights_of_women",
        title="Do women have natural rights equal to men?",
        description="Examine the argument that rights derived from reason must be universal.",
    ),
    DebateTopic(
        id="marriage_slavery",
        title="Is traditional marriage a form of subjugation?",
        description="Discuss Wollstonecraft's critique of marriage laws and economic dependence.",
    ),
    DebateTopic(
        id="virtue_gender",
        title="Is virtue the same for men and women?",
        description="Debate whether gender-specific virtues are valid or merely tools of oppression.",
    ),
]

MARX_TOPICS = [
    DebateTopic(
        id="class_struggle",
        title="Is history driven by class struggle?",
        description="Explore Marx's materialist conception of history and the motor of class conflict.",
        prompt_hint="Focus on the base-superstructure model and historical materialism.",
    ),
    DebateTopic(
        id="capitalism_alienation",
        title="Does capitalism alienate workers?",
        description="Debate Marx's theory of alienated labor and the estrangement from one's own productive activity.",
    ),
    DebateTopic(
        id="private_property",
        title="Should private property be abolished?",
        description="Examine Marx's argument that private ownership of the means of production is the root of exploitation.",
    ),
    DebateTopic(
        id="revolution",
        title="Is violent revolution inevitable?",
        description="Discuss whether the bourgeoisie will ever voluntarily relinquish power.",
    ),
    DebateTopic(
        id="religion_opium",
        title="Is religion the opium of the people?",
        description="Explore Marx's critique that religion mystifies real social conditions and dulls resistance.",
    ),
]

THOREAU_TOPICS = [
    DebateTopic(
        id="civil_disobedience",
        title="When must we disobey unjust laws?",
        description="Explore Thoreau's argument that conscience trumps legal obligation.",
        prompt_hint="Focus on the duty of conscience vs. political obligation and the meaning of 'under a government that imprisons anyone unjustly'.",
    ),
    DebateTopic(
        id="conscience_vs_majority",
        title="Should the individual conscience override majority rule?",
        description="Debate the tension between democratic consent and individual moral responsibility.",
    ),
    DebateTopic(
        id="simple_living",
        title="Is simplicity the path to freedom?",
        description="Discuss Thoreau's argument from Walden that material excess enslaves us.",
    ),
    DebateTopic(
        id="government_necessity",
        title="How much government do we actually need?",
        description="Examine Thoreau's near-anarchist claim that the best government governs least.",
    ),
    DebateTopic(
        id="nature_moral",
        title="Can nature teach us how to live?",
        description="Explore the transcendentalist view that immersion in nature clarifies moral truth.",
    ),
]

SENECA_TOPICS = [
    DebateTopic(
        id="shortness_of_life",
        title="Is life too short, or do we waste it?",
        description="Explore Seneca's argument that life is long enough if we use it wisely.",
        prompt_hint="Focus on the distinction between living and merely existing, and the role of philosophy in reclaiming time.",
    ),
    DebateTopic(
        id="death_fear",
        title="Should we fear death?",
        description="Debate Seneca's Stoic case that rehearsing death liberates us for full living.",
    ),
    DebateTopic(
        id="wealth_virtue",
        title="Can wealth coexist with virtue?",
        description="Examine Seneca's nuanced view that wealth is neither good nor bad—only how we use it matters.",
    ),
    DebateTopic(
        id="friendship",
        title="What is true friendship?",
        description="Discuss Seneca's argument that genuine friendship requires shared virtue, not mere utility.",
    ),
    DebateTopic(
        id="anger",
        title="Is anger ever justified?",
        description="Debate Seneca's radical claim that anger is always a failure of reason and never serves justice.",
    ),
]

CICERO_TOPICS = [
    DebateTopic(
        id="duty_vs_advantage",
        title="Can what is right ever conflict with what is advantageous?",
        description="Explore Cicero's central argument in De Officiis that honesty and advantage never truly conflict.",
        prompt_hint="Focus on the argument that apparent conflicts between duty and advantage are illusions caused by short-term thinking.",
    ),
    DebateTopic(
        id="natural_law",
        title="Is there a natural law above human law?",
        description="Debate Cicero's Stoic-derived claim that true law is right reason in agreement with nature.",
    ),
    DebateTopic(
        id="justice_society",
        title="Is justice the foundation of society?",
        description="Discuss Cicero's argument that society cannot exist without justice and good faith.",
    ),
    DebateTopic(
        id="statesman_virtue",
        title="Must a statesman be virtuous?",
        description="Examine whether political effectiveness requires genuine moral character.",
    ),
    DebateTopic(
        id="republic_best_government",
        title="What is the best form of government?",
        description="Debate Cicero's case for a mixed constitution balancing monarchy, aristocracy, and democracy.",
    ),
]

LUCRETIUS_TOPICS = [
    DebateTopic(
        id="fear_death_epicurean",
        title="Why should we not fear death?",
        description="Explore Lucretius's materialist argument: death is nothing to us, since we will not exist to experience it.",
        prompt_hint="Focus on the symmetry argument—we were not distressed before birth, so why fear the mirror state after death?",
    ),
    DebateTopic(
        id="religion_harm",
        title="Does religion cause more harm than good?",
        description="Debate Lucretius's claim that superstition and religious fear are the roots of human cruelty and suffering.",
    ),
    DebateTopic(
        id="atoms_free_will",
        title="Can free will exist in a purely material universe?",
        description="Discuss the Epicurean 'swerve' of atoms as a foundation for agency in a deterministic world.",
    ),
    DebateTopic(
        id="pleasure_good",
        title="Is pleasure the highest good?",
        description="Examine Epicurean ataraxia—tranquility and freedom from pain—as the true goal of life.",
    ),
    DebateTopic(
        id="progress_civilisation",
        title="Has civilisation made humans happier?",
        description="Debate Lucretius's ambivalent account of how technology and society have transformed but not necessarily improved human life.",
    ),
]

DESCARTES_TOPICS = [
    DebateTopic(
        id="doubt_knowledge",
        title="Can we know anything with certainty?",
        description="Explore Descartes's method of radical doubt and what survives it.",
        prompt_hint="Focus on the Cogito and what it establishes—existence of the thinking self—before moving to God and the external world.",
    ),
    DebateTopic(
        id="mind_body",
        title="Are the mind and body fundamentally different?",
        description="Debate Cartesian dualism and the problem of how two radically different substances can interact.",
    ),
    DebateTopic(
        id="god_existence",
        title="Does God's existence follow from pure reason?",
        description="Examine Descartes's ontological and causal arguments for God's existence from the Meditations.",
    ),
    DebateTopic(
        id="senses_deception",
        title="Can we trust our senses?",
        description="Discuss the evil demon hypothesis and why Descartes thinks perception is an unreliable guide to truth.",
    ),
    DebateTopic(
        id="reason_vs_experience",
        title="Is reason the primary source of knowledge?",
        description="Debate Cartesian rationalism against empiricist alternatives—do we know through reason or experience?",
    ),
]

SPINOZA_TOPICS = [
    DebateTopic(
        id="god_nature",
        title="Is God the same as Nature?",
        description="Explore Spinoza's pantheism—Deus sive Natura—and what it means for religion and philosophy.",
        prompt_hint="Focus on Substance monism: there is only one substance, which is God/Nature, of which everything else is a mode.",
    ),
    DebateTopic(
        id="free_will_determinism",
        title="Is free will an illusion?",
        description="Debate Spinoza's strict determinism and his redefinition of freedom as acting from one's own nature.",
    ),
    DebateTopic(
        id="emotions_reason",
        title="Can reason overcome our emotions?",
        description="Discuss Spinoza's claim that we can only free ourselves from passive emotions by understanding them through reason.",
    ),
    DebateTopic(
        id="democracy_best",
        title="Is democracy the most rational form of government?",
        description="Examine Spinoza's political philosophy: why democracy best preserves individual reason and collective freedom.",
    ),
    DebateTopic(
        id="good_evil_relative",
        title="Are good and evil absolute or relative?",
        description="Debate Spinoza's claim that good and evil are not intrinsic properties but expressions of human desire and perspective.",
    ),
]

LEIBNIZ_TOPICS = [
    DebateTopic(
        id="best_possible_world",
        title="Is this the best of all possible worlds?",
        description="Explore Leibniz's theodicy—God chose this world because it maximises perfection.",
        prompt_hint="Focus on the principle of sufficient reason and the compossibility of perfections.",
    ),
    DebateTopic(
        id="god_evil",
        title="How can God allow evil to exist?",
        description="Debate Leibniz's solution to the problem of evil through the concept of pre-established harmony and greater goods.",
    ),
    DebateTopic(
        id="monadology",
        title="Is reality fundamentally mental, not material?",
        description="Examine Leibniz's claim that the basic units of reality are mind-like monads, not material atoms.",
    ),
    DebateTopic(
        id="identity_difference",
        title="What makes two things identical?",
        description="Discuss the principle of the identity of indiscernibles and its implications.",
    ),
    DebateTopic(
        id="space_time_relative",
        title="Are space and time real, or just relations?",
        description="Debate Leibniz's relational view of space and time against Newton's absolutism.",
    ),
]

VOLTAIRE_TOPICS = [
    DebateTopic(
        id="optimism_wrong",
        title="Is optimism about the world naive or dangerous?",
        description="Explore Voltaire's devastating satire of Leibnizian optimism through Candide.",
        prompt_hint="Focus on the Lisbon earthquake and other historical catastrophes as evidence against providentialism.",
    ),
    DebateTopic(
        id="religious_tolerance",
        title="Should religion be tolerated or challenged?",
        description="Debate Voltaire's campaign against religious fanaticism and his call for universal tolerance.",
    ),
    DebateTopic(
        id="progress_reason",
        title="Does reason lead to progress?",
        description="Examine Voltaire's Enlightenment faith in reason while confronting its limits.",
    ),
    DebateTopic(
        id="cultivate_garden",
        title="Is withdrawal from politics the wisest response to a corrupt world?",
        description="Debate the conclusion of Candide—'we must cultivate our garden'—as pragmatism or escapism.",
    ),
    DebateTopic(
        id="church_state",
        title="Should church and state be separated?",
        description="Discuss Voltaire's argument that clerical power corrupts both religion and government.",
    ),
]

PAINE_TOPICS = [
    DebateTopic(
        id="monarchy_absurd",
        title="Is monarchy a rational form of government?",
        description="Explore Paine's argument in Common Sense that monarchy is absurd, hereditary, and contrary to natural equality.",
        prompt_hint="Focus on the argument from the Bible and natural reason against hereditary succession.",
    ),
    DebateTopic(
        id="revolution_justified",
        title="When is revolution against a government justified?",
        description="Debate Paine's case that oppressive government dissolves the social contract and revolution becomes a duty.",
    ),
    DebateTopic(
        id="rights_of_man",
        title="Are rights universal and inalienable?",
        description="Examine Paine's argument that natural rights precede government and cannot be legitimately taken away.",
    ),
    DebateTopic(
        id="tradition_authority",
        title="Does tradition justify political authority?",
        description="Debate Paine's rejection of Burke's defense of inherited institutions and historical precedent.",
    ),
    DebateTopic(
        id="republican_democracy",
        title="Is republican self-government the natural destiny of free people?",
        description="Discuss Paine's vision of representative democracy as the fulfillment of Enlightenment principles.",
    ),
]

BURKE_TOPICS = [
    DebateTopic(
        id="tradition_wisdom",
        title="Is tradition a source of wisdom that reason cannot replace?",
        description="Explore Burke's argument that inherited institutions embody accumulated practical wisdom.",
        prompt_hint="Focus on the idea that society is a partnership between the dead, the living, and the unborn.",
    ),
    DebateTopic(
        id="revolution_dangerous",
        title="Are radical revolutions always destructive?",
        description="Debate Burke's critique of the French Revolution as the destruction of civilization in the name of abstract theory.",
    ),
    DebateTopic(
        id="abstract_rights",
        title="Are abstract universal rights dangerous?",
        description="Examine Burke's claim that rights must be grounded in historical particulars, not universal abstractions.",
    ),
    DebateTopic(
        id="reform_vs_revolution",
        title="Is gradual reform superior to rapid transformation?",
        description="Discuss the Burkean case for incremental change that preserves continuity with the past.",
    ),
    DebateTopic(
        id="elite_leadership",
        title="Should governance be entrusted to a natural aristocracy?",
        description="Debate Burke's belief that wisdom and virtue, not popular will alone, should guide political decisions.",
    ),
]

DOUGLASS_TOPICS = [
    DebateTopic(
        id="slavery_freedom",
        title="Can anyone be truly free while others are enslaved?",
        description="Explore Douglass's argument that slavery corrupts not only the enslaved but the entire society that permits it.",
        prompt_hint="Focus on how slavery dehumanises the enslaver as well, and how freedom is indivisible.",
    ),
    DebateTopic(
        id="knowledge_liberation",
        title="Is knowledge the key to liberation?",
        description="Debate Douglass's insight that literacy and education are the path from slavery to freedom.",
    ),
    DebateTopic(
        id="what_is_fourth_of_july",
        title="Can a nation celebrate freedom while practising oppression?",
        description="Discuss Douglass's searing question: what does the Fourth of July mean to a slave?",
    ),
    DebateTopic(
        id="resistance_justified",
        title="Is violent resistance to oppression ever justified?",
        description="Examine Douglass's evolving view on whether enslaved people have the right to use force against their enslavers.",
    ),
    DebateTopic(
        id="constitution_slavery",
        title="Is the US Constitution a pro-slavery or anti-slavery document?",
        description="Debate Douglass's argument that the Constitution, properly read, is a glorious liberty document.",
    ),
]

EMERSON_TOPICS = [
    DebateTopic(
        id="self_reliance",
        title="Should we trust ourselves above all external authority?",
        description="Explore Emerson's call for radical self-reliance and nonconformity as the highest human virtue.",
        prompt_hint="Focus on the argument that imitation is suicide and consistency is the hobgoblin of little minds.",
    ),
    DebateTopic(
        id="society_conformity",
        title="Does society destroy individuality?",
        description="Debate Emerson's claim that social pressure to conform is the primary enemy of genius and growth.",
    ),
    DebateTopic(
        id="nature_soul",
        title="Is nature a mirror of the human soul?",
        description="Discuss Emerson's transcendentalist view that the natural world and the inner life are one.",
    ),
    DebateTopic(
        id="consistency_foolish",
        title="Is changing your mind a sign of weakness or wisdom?",
        description="Examine the argument that foolish consistency hobbles growth, while genuine wisdom requires updating beliefs.",
    ),
    DebateTopic(
        id="great_men_history",
        title="Do great individuals drive history?",
        description="Debate Emerson's belief in the transformative power of exceptional individuals against structural accounts of history.",
    ),
]

DUBOIS_TOPICS = [
    DebateTopic(
        id="double_consciousness",
        title="What does it mean to have a 'double consciousness'?",
        description="Explore Du Bois's concept of the two-ness of Black American identity—seeing oneself through the eyes of a hostile world.",
        prompt_hint="Focus on the veil and the sense of 'always looking at oneself through the eyes of others.'",
    ),
    DebateTopic(
        id="education_industrial",
        title="Should education focus on practical skills or the full development of the person?",
        description="Debate Du Bois's critique of Booker T. Washington's industrial education model in favor of the 'Talented Tenth.'",
    ),
    DebateTopic(
        id="racism_democracy",
        title="Can a democracy coexist with systematic racism?",
        description="Discuss Du Bois's argument that the colour line is the central problem of the twentieth century.",
    ),
    DebateTopic(
        id="culture_identity",
        title="Is cultural identity a source of strength or division?",
        description="Examine Du Bois's argument for preserving Black cultural identity against assimilationist pressure.",
    ),
    DebateTopic(
        id="justice_delayed",
        title="Is patience in the face of injustice a virtue or a betrayal?",
        description="Debate whether incremental progress is enough or whether justice demands urgency.",
    ),
]

DARWIN_TOPICS = [
    DebateTopic(
        id="evolution_design",
        title="Does evolution rule out intelligent design?",
        description="Explore Darwin's argument that natural selection explains complexity without requiring a designer.",
        prompt_hint="Focus on the argument from variation, inheritance, and selection pressure—and the inadequacy of the argument from design.",
    ),
    DebateTopic(
        id="human_animal",
        title="Are humans just another animal?",
        description="Debate Darwin's case in The Descent of Man that human faculties differ in degree, not kind, from other animals.",
    ),
    DebateTopic(
        id="morality_evolved",
        title="Did morality evolve, or is it divinely given?",
        description="Examine Darwin's claim that moral instincts are products of natural selection acting on social animals.",
    ),
    DebateTopic(
        id="progress_nature",
        title="Is evolution a story of progress?",
        description="Discuss whether natural selection implies improvement or merely adaptation to circumstances.",
    ),
    DebateTopic(
        id="extinction_struggle",
        title="Is the struggle for existence the fundamental law of nature?",
        description="Debate the implications of Darwinian competition for human society and ethics.",
    ),
]

JAMES_TOPICS = [
    DebateTopic(
        id="truth_useful",
        title="Is truth what works?",
        description="Explore James's pragmatist definition: truth is what it is useful to believe.",
        prompt_hint="Focus on the cash-value of ideas—what difference does it make in practice if something is true?",
    ),
    DebateTopic(
        id="will_to_believe",
        title="Is it rational to believe something without sufficient evidence?",
        description="Debate James's argument that in genuine dilemmas, we have the right to believe on insufficient evidence.",
    ),
    DebateTopic(
        id="free_will_pragmatism",
        title="Does believing in free will make a difference?",
        description="Examine the pragmatist case that the practical consequences of believing in free will justify the belief.",
    ),
    DebateTopic(
        id="religious_experience",
        title="Is religious experience evidence for God?",
        description="Discuss James's empirical approach to mystical and religious experiences in The Varieties of Religious Experience.",
    ),
    DebateTopic(
        id="pluralism_universe",
        title="Is the universe one or many?",
        description="Debate James's radical pluralism against monism—the idea that reality is irreducibly diverse.",
    ),
]

TOCQUEVILLE_TOPICS = [
    DebateTopic(
        id="tyranny_majority",
        title="Can democracy become a tyranny of the majority?",
        description="Explore Tocqueville's warning that democratic equality breeds conformity and majority despotism.",
        prompt_hint="Focus on the social power of the majority—not just political but intellectual and cultural conformity.",
    ),
    DebateTopic(
        id="equality_freedom",
        title="Are equality and freedom in tension?",
        description="Debate Tocqueville's observation that the passion for equality can threaten liberty.",
    ),
    DebateTopic(
        id="individualism_danger",
        title="Is democratic individualism a danger to society?",
        description="Discuss Tocqueville's concern that democracy breeds a self-centred withdrawal from public life.",
    ),
    DebateTopic(
        id="religion_democracy",
        title="Does democracy need religion to survive?",
        description="Examine Tocqueville's argument that religion provides the moral foundation democratic societies require.",
    ),
    DebateTopic(
        id="soft_despotism",
        title="Can a government be despotic even while providing comfort?",
        description="Debate Tocqueville's concept of 'soft despotism'—a gentle, paternalist power that infantilises citizens.",
    ),
]

RUSSELL_TOPICS = [
    DebateTopic(
        id="appearance_reality",
        title="Is the world we perceive the real world?",
        description="Explore Russell's distinction between appearance and reality—do we ever have direct access to the external world?",
        prompt_hint="Focus on the sense-data argument: what we immediately experience are private appearances, not external objects.",
    ),
    DebateTopic(
        id="induction_justified",
        title="Is inductive reasoning ever truly justified?",
        description="Debate Russell's problem of induction—why repeated past experience cannot logically guarantee future outcomes.",
    ),
    DebateTopic(
        id="a_priori_knowledge",
        title="Is there knowledge independent of experience?",
        description="Examine Russell's treatment of a priori knowledge—mathematical and logical truths that don't require observation.",
    ),
    DebateTopic(
        id="value_philosophy",
        title="What is the value of philosophy?",
        description="Discuss Russell's defense of philosophy as enlarging our sense of what is possible, not providing dogmatic answers.",
    ),
    DebateTopic(
        id="religion_reason",
        title="Is religious belief compatible with reason?",
        description="Debate Russell's skeptical arguments against theism and his case for a purely secular, rational ethics.",
    ),
]

FIGURES_DATA = {
    Figure.machiavelli: FigureInfo(
        id="machiavelli",
        name="Niccolò Machiavelli",
        era="Renaissance Italy (1469-1527)",
        description="Italian diplomat and philosopher, author of 'The Prince'. Known for his pragmatic, often controversial advice on political power.",
        works=["The Prince", "Discourses on Livy"],
        topics=MACHIAVELLI_TOPICS,
        traits=["Pragmatic", "Cynical", "Politically astute", "Controversial"],
    ),
    Figure.socrates: FigureInfo(
        id="socrates",
        name="Socrates",
        era="Classical Athens (470-399 BCE)",
        description="Greek philosopher who pioneered the Socratic method. Known for claiming to know nothing while exposing the ignorance of others through questioning.",
        works=["Apology", "Crito", "Euthyphro", "Phaedo"],
        topics=SOCRATES_TOPICS,
        traits=["Questioning", "Ironic", "Humble", "Relentless seeker of truth"],
    ),
    Figure.epictetus: FigureInfo(
        id="epictetus",
        name="Epictetus",
        era="Roman Empire (50-135 CE)",
        description="Former slave who became a Stoic philosopher. Author of the Enchiridion, a manual of Stoic ethics emphasizing the dichotomy of control.",
        works=["Enchiridion", "Discourses"],
        topics=EPICTETUS_TOPICS,
        traits=["Direct", "Practical", "Uncompromising", "Liberating"],
    ),
    Figure.mill: FigureInfo(
        id="mill",
        name="John Stuart Mill",
        era="British Empire (1806-1873)",
        description="English philosopher and political economist. Pioneer of liberal thought and utilitarianism, advocate for individual liberty and women's rights.",
        works=["On Liberty", "Utilitarianism", "The Subjection of Women"],
        topics=MILL_TOPICS,
        traits=["Logical", "Principled", "Reformist", "Analytical"],
    ),
    Figure.aurelius: FigureInfo(
        id="aurelius",
        name="Marcus Aurelius",
        era="Roman Empire (121-180 CE)",
        description="Roman Emperor and Stoic philosopher. The last of the Five Good Emperors, author of 'Meditations' written during military campaigns.",
        works=["Meditations"],
        topics=AURELIUS_TOPICS,
        traits=["Reflective", "Duty-bound", "Calm", "Self-examining"],
    ),
    Figure.locke: FigureInfo(
        id="locke",
        name="John Locke",
        era="England (1632-1704)",
        description="English philosopher considered the Father of Liberalism. Developed social contract theory and influential theories of natural rights and property.",
        works=[
            "Two Treatises of Government",
            "An Essay Concerning Human Understanding",
        ],
        topics=LOCKE_TOPICS,
        traits=["Reasoned", "Moderate", "Liberal", "Empirical"],
    ),
    Figure.rousseau: FigureInfo(
        id="rousseau",
        name="Jean-Jacques Rousseau",
        era="Geneva (1712-1778)",
        description="French philosopher and writer. Influential social contract theorist whose ideas inspired the French Revolution and modern political thought.",
        works=["The Social Contract", "Discourse on Inequality", "Julie"],
        topics=ROUSSEAU_TOPICS,
        traits=["Passionate", "Romantic", "Revolutionary", "Controversial"],
    ),
    Figure.nietzsche: FigureInfo(
        id="nietzsche",
        name="Friedrich Nietzsche",
        era="Germany (1844-1900)",
        description="German philosopher who challenged traditional morality and religion. Known for concepts like the Übermensch, will to power, and eternal recurrence.",
        works=[
            "Beyond Good and Evil",
            "Thus Spoke Zarathustra",
            "The Genealogy of Morals",
        ],
        topics=NIETZSCHE_TOPICS,
        traits=["Provocative", "Radical", "Poetic", "Controversial"],
    ),
    Figure.hobbes: FigureInfo(
        id="hobbes",
        name="Thomas Hobbes",
        era="England (1588-1679)",
        description="English philosopher known for his materialist views and social contract theory. Author of Leviathan, arguing for absolute sovereign authority.",
        works=["Leviathan", "De Cive", "Behemoth"],
        topics=HOBBES_TOPICS,
        traits=["Authoritative", "Bleak", "Materialist", "Controversial"],
    ),
    Figure.plato: FigureInfo(
        id="plato",
        name="Plato",
        era="Classical Athens (428–348 BCE)",
        description="Student of Socrates and teacher of Aristotle. Author of the Republic and the dialogues, Plato founded the Academy and developed the Theory of Forms—one of the most influential philosophical systems in history.",
        works=["The Republic", "Phaedo", "Symposium", "Meno", "Timaeus"],
        topics=PLATO_TOPICS,
        traits=["Idealist", "Systematic", "Dialectical", "Visionary"],
    ),
    Figure.aristotle: FigureInfo(
        id="aristotle",
        name="Aristotle",
        era="Ancient Greece (384–322 BCE)",
        description="Polymath and student of Plato who founded the Lyceum. His Nicomachean Ethics established virtue ethics; his Politics and logic shaped Western thought for two millennia.",
        works=["Nicomachean Ethics", "Politics", "Metaphysics", "Poetics"],
        topics=ARISTOTLE_TOPICS,
        traits=["Empirical", "Systematic", "Balanced", "Practical"],
    ),
    Figure.hume: FigureInfo(
        id="hume",
        name="David Hume",
        era="Scotland (1711–1776)",
        description="Scottish Enlightenment philosopher and historian. His Enquiry Concerning Human Understanding and Treatise of Human Nature challenged the foundations of causation, induction, and rationalist ethics.",
        works=["An Enquiry Concerning Human Understanding", "A Treatise of Human Nature", "Dialogues Concerning Natural Religion"],
        topics=HUME_TOPICS,
        traits=["Skeptical", "Empirical", "Witty", "Radical"],
    ),
    Figure.kant: FigureInfo(
        id="kant",
        name="Immanuel Kant",
        era="Prussia (1724–1804)",
        description="German philosopher who attempted a 'Copernican revolution' in philosophy. His Critique of Pure Reason and Groundwork for the Metaphysics of Morals defined deontological ethics and modern epistemology.",
        works=["Groundwork for the Metaphysics of Morals", "Critique of Pure Reason", "Critique of Practical Reason"],
        topics=KANT_TOPICS,
        traits=["Rigorous", "Systematic", "Duty-bound", "Foundational"],
    ),
    Figure.wollstonecraft: FigureInfo(
        id="wollstonecraft",
        name="Mary Wollstonecraft",
        era="England (1759–1797)",
        description="English writer and early feminist philosopher. Her Vindication of the Rights of Woman (1792) argued that women's apparent inferiority was the product of inadequate education, not nature.",
        works=["A Vindication of the Rights of Woman", "A Vindication of the Rights of Men"],
        topics=WOLLSTONECRAFT_TOPICS,
        traits=["Passionate", "Rational", "Reformist", "Pioneering"],
    ),
    Figure.marx: FigureInfo(
        id="marx",
        name="Karl Marx",
        era="Germany / England (1818–1883)",
        description="German philosopher, economist, and revolutionary. Co-author of The Communist Manifesto and author of Das Kapital, Marx developed historical materialism and the critique of capitalism.",
        works=["The Communist Manifesto", "Das Kapital", "Economic and Philosophic Manuscripts of 1844"],
        topics=MARX_TOPICS,
        traits=["Revolutionary", "Analytical", "Passionate", "Confrontational"],
    ),
    Figure.thoreau: FigureInfo(
        id="thoreau",
        name="Henry David Thoreau",
        era="United States (1817–1862)",
        description="American transcendentalist writer and naturalist. His essay Civil Disobedience argued that individuals must resist unjust laws; Walden celebrated deliberate, simple living.",
        works=["Civil Disobedience", "Walden", "Walking"],
        topics=THOREAU_TOPICS,
        traits=["Independent", "Principled", "Naturalist", "Nonconformist"],
    ),
    Figure.seneca: FigureInfo(
        id="seneca",
        name="Lucius Annaeus Seneca",
        era="Roman Empire (4 BCE–65 CE)",
        description="Roman Stoic philosopher, statesman, and dramatist. Tutor and advisor to Emperor Nero. His Letters from a Stoic and essays on anger, clemency, and the shortness of life are among the most readable works of ancient philosophy.",
        works=["Letters from a Stoic (Epistulae Morales)", "On the Shortness of Life", "On Anger", "On Clemency"],
        topics=SENECA_TOPICS,
        traits=["Personal", "Practical", "Eloquent", "Self-critical"],
    ),
    Figure.cicero: FigureInfo(
        id="cicero",
        name="Marcus Tullius Cicero",
        era="Roman Republic (106–43 BCE)",
        description="Roman statesman, orator, and philosopher. Cicero synthesised Greek philosophy for a Roman audience. His On Duties (De Officiis) shaped Western ethics and political thought for two millennia.",
        works=["On Duties (De Officiis)", "On the Republic (De Re Publica)", "On the Laws", "Tusculan Disputations"],
        topics=CICERO_TOPICS,
        traits=["Oratorical", "Principled", "Political", "Eclectic"],
    ),
    Figure.lucretius: FigureInfo(
        id="lucretius",
        name="Titus Lucretius Carus",
        era="Roman Republic (99–55 BCE)",
        description="Roman poet and Epicurean philosopher. His On the Nature of Things (De Rerum Natura) is the most complete surviving account of Epicurean philosophy—arguing for materialism, the mortality of the soul, and freedom from religious fear.",
        works=["On the Nature of Things (De Rerum Natura)"],
        topics=LUCRETIUS_TOPICS,
        traits=["Poetic", "Materialist", "Anti-religious", "Liberating"],
    ),
    Figure.descartes: FigureInfo(
        id="descartes",
        name="René Descartes",
        era="France (1596–1650)",
        description="French philosopher and mathematician, the 'Father of Modern Philosophy.' His Meditations on First Philosophy established the Cogito ('I think, therefore I am') and Cartesian dualism, launching the rationalist tradition.",
        works=["Meditations on First Philosophy", "Discourse on the Method", "Principles of Philosophy"],
        topics=DESCARTES_TOPICS,
        traits=["Methodical", "Rigorous", "Rationalist", "Groundbreaking"],
    ),
    Figure.spinoza: FigureInfo(
        id="spinoza",
        name="Baruch Spinoza",
        era="Netherlands (1632–1677)",
        description="Dutch philosopher of Portuguese-Jewish descent, excommunicated for his radical ideas. His Ethics argues that God and Nature are one substance, freedom lies in understanding necessity, and democracy is the most rational government.",
        works=["Ethics (Ethica Ordine Geometrico Demonstrata)", "Theological-Political Treatise", "Political Treatise"],
        topics=SPINOZA_TOPICS,
        traits=["Geometrical", "Radical", "Pantheist", "Rigorous"],
    ),
    Figure.leibniz: FigureInfo(
        id="leibniz",
        name="Gottfried Wilhelm Leibniz",
        era="Germany (1646–1716)",
        description="German polymath — philosopher, mathematician, and diplomat. Co-inventor of calculus. His Monadology and theodicy argue that God created the best of all possible worlds, and that reality consists of mind-like units called monads.",
        works=["Monadology", "Discourse on Metaphysics", "Theodicy", "New Essays on Human Understanding"],
        topics=LEIBNIZ_TOPICS,
        traits=["Optimistic", "Systematic", "Theological", "Mathematical"],
    ),
    Figure.voltaire: FigureInfo(
        id="voltaire",
        name="Voltaire",
        era="France (1694–1778)",
        description="French Enlightenment writer, historian, and philosopher famous for his wit and advocacy of civil liberties, freedom of speech, and separation of church and state. Candide is his most celebrated satirical attack on religious optimism.",
        works=["Candide", "Philosophical Dictionary", "Letters on the English", "Treatise on Tolerance"],
        topics=VOLTAIRE_TOPICS,
        traits=["Witty", "Satirical", "Anti-clerical", "Relentless"],
    ),
    Figure.paine: FigureInfo(
        id="paine",
        name="Thomas Paine",
        era="England / America (1737–1809)",
        description="English-American political activist and revolutionary theorist. Common Sense (1776) galvanised American independence; Rights of Man (1791) defended the French Revolution; The Age of Reason challenged organised religion.",
        works=["Common Sense", "Rights of Man", "The Age of Reason"],
        topics=PAINE_TOPICS,
        traits=["Radical", "Plain-spoken", "Revolutionary", "Provocative"],
    ),
    Figure.burke: FigureInfo(
        id="burke",
        name="Edmund Burke",
        era="Ireland / England (1729–1797)",
        description="Anglo-Irish statesman and philosopher, the founding father of modern conservatism. His Reflections on the Revolution in France (1790) argued that inherited institutions and gradual reform are superior to abstract revolutionary theory.",
        works=["Reflections on the Revolution in France", "A Vindication of Natural Society", "On the Sublime and Beautiful"],
        topics=BURKE_TOPICS,
        traits=["Traditionalist", "Eloquent", "Sceptical of abstraction", "Prudential"],
    ),
    Figure.douglass: FigureInfo(
        id="douglass",
        name="Frederick Douglass",
        era="United States (1818–1895)",
        description="American abolitionist, orator, statesman, and writer who escaped slavery to become one of the most influential voices for freedom and equality in American history. His Narrative and speeches remain among the most powerful arguments for human dignity ever written.",
        works=["Narrative of the Life of Frederick Douglass", "My Bondage and My Freedom", "What to the Slave is the Fourth of July?"],
        topics=DOUGLASS_TOPICS,
        traits=["Commanding", "Moral", "Autobiographical", "Uncompromising"],
    ),
    Figure.emerson: FigureInfo(
        id="emerson",
        name="Ralph Waldo Emerson",
        era="United States (1803–1882)",
        description="American essayist, philosopher, and poet who led the Transcendentalist movement. His essays Self-Reliance and Nature argue for the primacy of individual intuition, the divinity of the natural world, and nonconformity.",
        works=["Essays: First Series (Self-Reliance, The Over-Soul)", "Essays: Second Series", "Nature", "Representative Men"],
        topics=EMERSON_TOPICS,
        traits=["Visionary", "Individualist", "Lyrical", "Transcendentalist"],
    ),
    Figure.dubois: FigureInfo(
        id="dubois",
        name="W.E.B. Du Bois",
        era="United States (1868–1963)",
        description="American sociologist, historian, and civil rights activist. Co-founder of the NAACP. His The Souls of Black Folk introduced the concept of double consciousness and argued for full political and educational equality for Black Americans.",
        works=["The Souls of Black Folk", "Darkwater", "Black Reconstruction in America"],
        topics=DUBOIS_TOPICS,
        traits=["Scholarly", "Passionate", "Prophetic", "Unflinching"],
    ),
    Figure.darwin: FigureInfo(
        id="darwin",
        name="Charles Darwin",
        era="England (1809–1882)",
        description="English naturalist and biologist whose On the Origin of Species (1859) established the theory of evolution by natural selection, transforming biology, philosophy, and our understanding of humanity's place in nature.",
        works=["On the Origin of Species", "The Descent of Man", "The Expression of the Emotions in Man and Animals"],
        topics=DARWIN_TOPICS,
        traits=["Meticulous", "Cautious", "Evidence-driven", "Revolutionary"],
    ),
    Figure.james: FigureInfo(
        id="james",
        name="William James",
        era="United States (1842–1910)",
        description="American philosopher and psychologist, the father of American pragmatism. His Pragmatism and The Will to Believe argue that truth is what works in practice, and that we have the right to believe when evidence is insufficient.",
        works=["Pragmatism", "The Will to Believe", "The Varieties of Religious Experience", "Principles of Psychology"],
        topics=JAMES_TOPICS,
        traits=["Practical", "Open-minded", "Empirical", "Humanistic"],
    ),
    Figure.tocqueville: FigureInfo(
        id="tocqueville",
        name="Alexis de Tocqueville",
        era="France (1805–1859)",
        description="French political scientist and historian who visited America in 1831. Democracy in America is the most penetrating analysis of democratic society ever written, identifying both the promise and the pathologies of equality.",
        works=["Democracy in America", "The Old Regime and the Revolution"],
        topics=TOCQUEVILLE_TOPICS,
        traits=["Perceptive", "Balanced", "Prophetic", "Aristocratic"],
    ),
    Figure.russell: FigureInfo(
        id="russell",
        name="Bertrand Russell",
        era="England (1872–1970)",
        description="British philosopher, logician, mathematician, and social critic. His Problems of Philosophy offers a clear introduction to epistemology; his broader work encompasses logic, ethics, politics, and passionate advocacy for reason over dogma.",
        works=["The Problems of Philosophy", "Why I Am Not a Christian", "History of Western Philosophy", "Principia Mathematica"],
        topics=RUSSELL_TOPICS,
        traits=["Analytical", "Sceptical", "Witty", "Reformist"],
    ),
}
