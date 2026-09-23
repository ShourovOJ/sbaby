import type { Area, Checkpoint, Milestone } from './types'

/**
 * Developmental milestones from the CDC "Learn the Signs. Act Early." checklists (2022 revision).
 * Each milestone is something most children (75% or more) can do by that age.
 * Wording is lightly adapted to be gender-neutral.
 */
const m = (checkpointMonths: Checkpoint, area: Area, id: string, title: string): Milestone => ({
  id: `m${checkpointMonths}-${id}`,
  title,
  area,
  checkpointMonths,
})

export const MILESTONE_SOURCE = 'CDC "Learn the Signs. Act Early." milestone checklists (2022)'

export const milestones: Milestone[] = [
  // 2 months
  m(2, 'social', 'calms', 'Calms down when spoken to or picked up'),
  m(2, 'social', 'looks-face', 'Looks at your face'),
  m(2, 'social', 'happy-see', 'Seems happy to see you when you walk up'),
  m(2, 'social', 'smiles-back', 'Smiles when you talk to or smile at them'),
  m(2, 'language', 'sounds', 'Makes sounds other than crying'),
  m(2, 'language', 'loud-sounds', 'Reacts to loud sounds'),
  m(2, 'cognitive', 'watches-move', 'Watches you as you move'),
  m(2, 'cognitive', 'looks-toy', 'Looks at a toy for several seconds'),
  m(2, 'motor', 'head-up-tummy', 'Holds head up when on tummy'),
  m(2, 'motor', 'moves-limbs', 'Moves both arms and both legs'),
  m(2, 'motor', 'opens-hands', 'Opens hands briefly'),

  // 4 months
  m(4, 'social', 'smiles-attention', 'Smiles on their own to get your attention'),
  m(4, 'social', 'chuckles', 'Chuckles when you try to make them laugh'),
  m(4, 'social', 'keeps-attention', 'Looks at you, moves, or makes sounds to get or keep your attention'),
  m(4, 'language', 'coos', 'Makes cooing sounds like "oooo" and "aahh"'),
  m(4, 'language', 'sounds-back', 'Makes sounds back when you talk to them'),
  m(4, 'language', 'turns-voice', 'Turns head towards the sound of your voice'),
  m(4, 'cognitive', 'opens-mouth', 'Opens mouth when hungry and sees breast or bottle'),
  m(4, 'cognitive', 'looks-hands', 'Looks at their hands with interest'),
  m(4, 'motor', 'head-steady', 'Holds head steady without support when held'),
  m(4, 'motor', 'holds-toy', 'Holds a toy when you put it in their hand'),
  m(4, 'motor', 'swings-arm', 'Uses an arm to swing at toys'),
  m(4, 'motor', 'hands-mouth', 'Brings hands to mouth'),
  m(4, 'motor', 'pushes-elbows', 'Pushes up onto elbows or forearms when on tummy'),

  // 6 months
  m(6, 'social', 'knows-familiar', 'Knows familiar people'),
  m(6, 'social', 'mirror', 'Likes to look at themself in a mirror'),
  m(6, 'social', 'laughs', 'Laughs'),
  m(6, 'language', 'turn-taking', 'Takes turns making sounds with you'),
  m(6, 'language', 'raspberries', 'Blows "raspberries" (sticks tongue out and blows)'),
  m(6, 'language', 'squeals', 'Makes squealing noises'),
  m(6, 'cognitive', 'mouths', 'Puts things in their mouth to explore them'),
  m(6, 'cognitive', 'reaches-grab', 'Reaches to grab a toy they want'),
  m(6, 'cognitive', 'closes-lips', "Closes lips to show they don't want more food"),
  m(6, 'motor', 'rolls-tummy-back', 'Rolls from tummy to back'),
  m(6, 'motor', 'straight-arms', 'Pushes up with straight arms when on tummy'),
  m(6, 'motor', 'leans-hands', 'Leans on hands to support themself when sitting'),

  // 9 months
  m(9, 'social', 'strangers', 'Is shy, clingy, or fearful around strangers'),
  m(9, 'social', 'expressions', 'Shows several facial expressions, like happy, sad, angry, and surprised'),
  m(9, 'social', 'name', 'Looks when you call their name'),
  m(9, 'social', 'reacts-leave', 'Reacts when you leave (looks, reaches for you, or cries)'),
  m(9, 'social', 'peekaboo', 'Smiles or laughs when you play peek-a-boo'),
  m(9, 'language', 'babbles', 'Makes different sounds like "mamamama" and "babababa"'),
  m(9, 'language', 'arms-up', 'Lifts arms up to be picked up'),
  m(9, 'cognitive', 'looks-dropped', 'Looks for objects when dropped out of sight'),
  m(9, 'cognitive', 'bangs', 'Bangs two things together'),
  m(9, 'motor', 'gets-sitting', 'Gets to a sitting position by themself'),
  m(9, 'motor', 'hand-to-hand', 'Moves things from one hand to the other'),
  m(9, 'motor', 'rakes', 'Uses fingers to "rake" food towards themself'),
  m(9, 'motor', 'sits', 'Sits without support'),

  // 12 months
  m(12, 'social', 'pat-a-cake', 'Plays games with you, like pat-a-cake'),
  m(12, 'language', 'waves', 'Waves "bye-bye"'),
  m(12, 'language', 'mama-dada', 'Calls a parent "mama", "dada", or another special name'),
  m(12, 'language', 'understands-no', 'Understands "no" (pauses briefly or stops when you say it)'),
  m(12, 'cognitive', 'container', 'Puts something in a container, like a block in a cup'),
  m(12, 'cognitive', 'finds-hidden', 'Looks for things they see you hide, like a toy under a blanket'),
  m(12, 'motor', 'pulls-stand', 'Pulls up to stand'),
  m(12, 'motor', 'cruises', 'Walks, holding on to furniture'),
  m(12, 'motor', 'open-cup-held', 'Drinks from a cup without a lid, as you hold it'),
  m(12, 'motor', 'pincer', 'Picks things up between thumb and pointer finger'),

  // 15 months
  m(15, 'social', 'copies-children', 'Copies other children while playing'),
  m(15, 'social', 'shows-object', 'Shows you an object they like'),
  m(15, 'social', 'claps', 'Claps when excited'),
  m(15, 'social', 'hugs-toy', 'Hugs a stuffed toy or doll'),
  m(15, 'social', 'affection', 'Shows you affection (hugs, cuddles, or kisses you)'),
  m(15, 'language', 'one-two-words', 'Tries to say one or two words besides "mama" or "dada"'),
  m(15, 'language', 'looks-named', 'Looks at a familiar object when you name it'),
  m(15, 'language', 'gesture-directions', 'Follows directions given with both a gesture and words'),
  m(15, 'language', 'points-ask', 'Points to ask for something or to get help'),
  m(15, 'cognitive', 'uses-right', 'Tries to use things the right way, like a phone, cup, or book'),
  m(15, 'cognitive', 'stacks-two', 'Stacks at least two small objects, like blocks'),
  m(15, 'motor', 'few-steps', 'Takes a few steps on their own'),
  m(15, 'motor', 'finger-feeds', 'Uses fingers to feed themself some food'),

  // 18 months
  m(18, 'social', 'checks-back', 'Moves away from you, but looks to make sure you are close by'),
  m(18, 'social', 'points-show', 'Points to show you something interesting'),
  m(18, 'social', 'hands-wash', 'Puts hands out for you to wash them'),
  m(18, 'social', 'book-pages', 'Looks at a few pages in a book with you'),
  m(18, 'social', 'helps-dress', 'Helps you dress them by pushing an arm through a sleeve or lifting a foot'),
  m(18, 'language', 'three-words', 'Tries to say three or more words besides "mama" or "dada"'),
  m(18, 'language', 'one-step', 'Follows one-step directions without any gestures'),
  m(18, 'cognitive', 'copies-chores', 'Copies you doing chores, like sweeping with a broom'),
  m(18, 'cognitive', 'simple-play', 'Plays with toys in a simple way, like pushing a toy car'),
  m(18, 'motor', 'walks', 'Walks without holding on to anyone or anything'),
  m(18, 'motor', 'scribbles', 'Scribbles'),
  m(18, 'motor', 'open-cup', 'Drinks from a cup without a lid and may spill sometimes'),
  m(18, 'motor', 'self-feeds', 'Feeds themself with their fingers'),
  m(18, 'motor', 'tries-spoon', 'Tries to use a spoon'),
  m(18, 'motor', 'climbs-couch', 'Climbs on and off a couch or chair without help'),

  // 24 months
  m(24, 'social', 'notices-upset', 'Notices when others are hurt or upset'),
  m(24, 'social', 'social-ref', 'Looks at your face to see how to react in a new situation'),
  m(24, 'language', 'points-book', 'Points to things in a book when you ask'),
  m(24, 'language', 'two-words', 'Says at least two words together, like "More milk"'),
  m(24, 'language', 'body-parts', 'Points to at least two body parts when you ask'),
  m(24, 'language', 'more-gestures', 'Uses more gestures than waving and pointing, like blowing a kiss or nodding yes'),
  m(24, 'cognitive', 'holds-uses', 'Holds something in one hand while using the other hand'),
  m(24, 'cognitive', 'switches', 'Tries to use switches, knobs, or buttons on a toy'),
  m(24, 'cognitive', 'multi-toys', 'Plays with more than one toy at the same time'),
  m(24, 'motor', 'kicks', 'Kicks a ball'),
  m(24, 'motor', 'runs', 'Runs'),
  m(24, 'motor', 'stairs', 'Walks (not climbs) up a few stairs, with or without help'),
  m(24, 'motor', 'eats-spoon', 'Eats with a spoon'),
]

export const milestoneById = new Map(milestones.map((x) => [x.id, x]))
