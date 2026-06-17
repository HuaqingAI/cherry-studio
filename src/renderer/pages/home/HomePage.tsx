import { usePreference } from '@data/hooks/usePreference'
import { loggerService } from '@logger'
import { ErrorBoundary } from '@renderer/components/ErrorBoundary'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { useNavbarPosition } from '@renderer/hooks/useNavbar'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import { useShowAssistants, useShowTopics } from '@renderer/hooks/useStore'
import { useActiveTopic } from '@renderer/hooks/useTopic'
import { createAssistantWithDefaultTopic } from '@renderer/services/AssistantService'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import NavigationService from '@renderer/services/NavigationService'
import { newMessagesActions } from '@renderer/store/newMessage'
import type { Assistant, Topic } from '@renderer/types'
import { MIN_WINDOW_HEIGHT, MIN_WINDOW_WIDTH, SECOND_MIN_WINDOW_WIDTH } from '@shared/config/constant'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'motion/react'
import type { FC } from 'react'
import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'

import Chat from './Chat'
import Navbar from './Navbar'
import HomeTabs from './Tabs'

let _activeAssistant: Assistant

const logger = loggerService.withContext('HomePage')

function isTemporaryDefaultAssistant(assistant?: Assistant): boolean {
  return assistant?.id === 'default' || assistant?.topics?.some((topic) => topic.assistantId === 'default') === true
}

const HomePage: FC = () => {
  const { assistants, updateAssistants } = useAssistants()
  const navigate = useNavigate()
  const { isLeftNavbar } = useNavbarPosition()

  const location = useLocation()
  const state = location.state as { assistant?: Assistant; topic?: Topic } | undefined

  const [activeAssistant, _setActiveAssistant] = useState<Assistant>(
    state?.assistant || _activeAssistant || assistants[0]
  )

  const { activeTopic, setActiveTopic: _setActiveTopic } = useActiveTopic(activeAssistant?.id ?? '', state?.topic)
  const [showAssistants] = usePreference('assistant.tab.show')
  const [showTopics] = usePreference('topic.tab.show')
  const [topicPosition] = usePreference('topic.position')
  const { setShowAssistants, toggleShowAssistants } = useShowAssistants()
  const { toggleShowTopics } = useShowTopics()
  const dispatch = useDispatch()
  const defaultAssistantUpgradeRef = useRef<string | null>(null)
  const [isDefaultAssistantUpgrading, setIsDefaultAssistantUpgrading] = useState(false)
  const [defaultAssistantUpgradeFailed, setDefaultAssistantUpgradeFailed] = useState(false)

  _activeAssistant = activeAssistant

  // TODO: Replace with sidebar toggle logic once the new sidebar UI is implemented
  useShortcut('general.toggle_sidebar', () => {
    if (topicPosition === 'right') {
      void toggleShowAssistants()
      return
    }

    if (!showAssistants) {
      void setShowAssistants(true)
      requestAnimationFrame(() => {
        void EventEmitter.emit(EVENT_NAMES.SHOW_ASSISTANTS)
      })
      return
    }

    void EventEmitter.emit(EVENT_NAMES.SHOW_ASSISTANTS)
  })

  useShortcut('topic.toggle_show_topics', () => {
    if (topicPosition === 'right') {
      void toggleShowTopics()
      return
    }

    if (!showAssistants) {
      void setShowAssistants(true)
      requestAnimationFrame(() => {
        void EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR)
      })
      return
    }

    void EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR)
  })

  const setActiveAssistant = useCallback(
    (newAssistant: Assistant) => {
      if (newAssistant.id === activeAssistant?.id) return
      startTransition(() => {
        _setActiveAssistant(newAssistant)
        // 同步更新 active topic，避免不必要的重新渲染
        const newTopic = newAssistant.topics[0]
        _setActiveTopic((prev) => (newTopic?.id === prev.id ? prev : newTopic))
      })
    },
    [_setActiveTopic, activeAssistant?.id]
  )

  const setActiveTopic = useCallback(
    (newTopic: Topic) => {
      startTransition(() => {
        _setActiveTopic((prev) => (newTopic?.id === prev.id ? prev : newTopic))
        dispatch(newMessagesActions.setTopicFulfilled({ topicId: newTopic.id, fulfilled: false }))
      })
    },
    [_setActiveTopic, dispatch]
  )

  const shouldUpgradeDefaultAssistant = !defaultAssistantUpgradeFailed && isTemporaryDefaultAssistant(activeAssistant)

  useEffect(() => {
    if (!activeAssistant || !shouldUpgradeDefaultAssistant) {
      return
    }

    if (defaultAssistantUpgradeRef.current === activeAssistant.id) {
      return
    }

    defaultAssistantUpgradeRef.current = activeAssistant.id
    setIsDefaultAssistantUpgrading(true)

    void createAssistantWithDefaultTopic(activeAssistant)
      .then((assistant) => {
        const hasCurrentAssistant = assistants.some((item) => item.id === activeAssistant.id)
        updateAssistants(
          hasCurrentAssistant
            ? assistants.map((item) => (item.id === activeAssistant.id ? assistant : item))
            : [assistant, ...assistants]
        )
        setActiveAssistant(assistant)
      })
      .catch((error) => {
        logger.error('Failed to initialize default assistant in DataApi', error as Error)
        setDefaultAssistantUpgradeFailed(true)
      })
      .finally(() => {
        setIsDefaultAssistantUpgrading(false)
      })
  }, [activeAssistant, assistants, setActiveAssistant, shouldUpgradeDefaultAssistant, updateAssistants])

  useEffect(() => {
    NavigationService.setNavigate(navigate)
  }, [navigate])

  useEffect(() => {
    state?.assistant && setActiveAssistant(state?.assistant)
    state?.topic && setActiveTopic(state?.topic)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  useEffect(() => {
    const canMinimize = topicPosition == 'left' ? !showAssistants : !showAssistants && !showTopics
    void window.api.window.setMinimumSize(canMinimize ? SECOND_MIN_WINDOW_WIDTH : MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT)

    return () => {
      void window.api.window.resetMinimumSize()
    }
  }, [showAssistants, showTopics, topicPosition])

  if (shouldUpgradeDefaultAssistant || isDefaultAssistantUpgrading) {
    return <Container id="home-page" />
  }

  return (
    <Container id="home-page">
      {isLeftNavbar && (
        <Navbar
          activeAssistant={activeAssistant}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
          setActiveAssistant={setActiveAssistant}
          position="left"
        />
      )}
      <ContentContainer id={isLeftNavbar ? 'content-container' : undefined}>
        <AnimatePresence initial={false}>
          {showAssistants && (
            <ErrorBoundary>
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 'var(--assistants-width)', opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}>
                <HomeTabs
                  activeAssistant={activeAssistant}
                  activeTopic={activeTopic}
                  setActiveAssistant={setActiveAssistant}
                  setActiveTopic={setActiveTopic}
                  position="left"
                />
              </motion.div>
            </ErrorBoundary>
          )}
        </AnimatePresence>
        <ErrorBoundary>
          <Chat
            assistant={activeAssistant}
            activeTopic={activeTopic}
            setActiveTopic={setActiveTopic}
            setActiveAssistant={setActiveAssistant}
          />
        </ErrorBoundary>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  [navbar-position='left'] & {
    max-width: calc(100vw - var(--sidebar-width));
  }
  [navbar-position='top'] & {
    max-width: 100vw;
  }
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  overflow: hidden;

  [navbar-position='top'] & {
    max-width: calc(100vw - 12px);
  }
`

export default HomePage
