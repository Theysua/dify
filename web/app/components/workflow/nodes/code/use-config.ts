import { useCallback, useEffect, useState } from 'react'
import produce from 'immer'
import useVarList from '../_base/hooks/use-var-list'
import useOutputVarList from '../_base/hooks/use-output-var-list'
import { BlockEnum, VarType } from '../../types'
import type { Var } from '../../types'
import { useStore } from '../../store'
import type { CodeNodeType } from './types'
import { CodeLanguage } from './types'
import useNodeCrud from '@/app/components/workflow/nodes/_base/hooks/use-node-crud'
import useOneStepRun from '@/app/components/workflow/nodes/_base/hooks/use-one-step-run'
import { fetchNodeDefault } from '@/service/workflow'
import { useStore as useAppStore } from '@/app/components/app/store'

const useConfig = (id: string, payload: CodeNodeType) => {
  const appId = useAppStore.getState().appDetail?.id

  const [allLanguageDefault, setAllLanguageDefault] = useState<Record<CodeLanguage, CodeNodeType> | null>(null)
  useEffect(() => {
    if (appId) {
      (async () => {
        const { config: javaScriptConfig } = await fetchNodeDefault(appId, BlockEnum.Code, { code_language: CodeLanguage.javascript }) as any
        const { config: pythonConfig } = await fetchNodeDefault(appId, BlockEnum.Code, { code_language: CodeLanguage.python3 }) as any
        setAllLanguageDefault({
          [CodeLanguage.javascript]: javaScriptConfig as CodeNodeType,
          [CodeLanguage.python3]: pythonConfig as CodeNodeType,
        } as any)
      })()
    }
  }, [appId])

  const defaultConfig = useStore(s => s.nodesDefaultConfigs)[payload.type]
  const { inputs, setInputs } = useNodeCrud<CodeNodeType>(id, payload)
  const { handleVarListChange, handleAddVariable } = useVarList<CodeNodeType>({
    inputs,
    setInputs,
  })

  useEffect(() => {
    if (inputs.code)
      return

    const isReady = defaultConfig && Object.keys(defaultConfig).length > 0
    if (isReady) {
      setInputs({
        ...inputs,
        ...defaultConfig,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultConfig])

  const handleCodeChange = useCallback((code: string) => {
    const newInputs = produce(inputs, (draft) => {
      draft.code = code
    })
    setInputs(newInputs)
  }, [inputs, setInputs])

  const handleCodeLanguageChange = useCallback((codeLanguage: CodeLanguage) => {
    const newInputs = produce(inputs, (draft) => {
      const currDefaultConfig = allLanguageDefault![codeLanguage]
      draft.code_language = codeLanguage
      draft.code = currDefaultConfig.code
      draft.variables = currDefaultConfig.variables
      draft.outputs = currDefaultConfig.outputs
    })
    setInputs(newInputs)
  }, [allLanguageDefault, inputs, setInputs])

  const { handleVarsChange, handleAddVariable: handleAddOutputVariable } = useOutputVarList<CodeNodeType>({
    inputs,
    setInputs,
  })

  const filterVar = useCallback((varPayload: Var) => {
    return [VarType.string, VarType.number, VarType.object, VarType.array, VarType.arrayNumber, VarType.arrayString, VarType.arrayObject].includes(varPayload.type)
  }, [])

  // single run
  const {
    isShowSingleRun,
    hideSingleRun,
    toVarInputs,
    runningStatus,
    isCompleted,
    handleRun,
    handleStop,
    runInputData,
    setRunInputData,
    runResult,
  } = useOneStepRun<CodeNodeType>({
    id,
    data: inputs,
    defaultRunInputData: {},
  })

  const varInputs = toVarInputs(inputs.variables)

  const inputVarValues = (() => {
    const vars: Record<string, any> = {}
    Object.keys(runInputData)
      .forEach((key) => {
        vars[key] = runInputData[key]
      })
    return vars
  })()

  const setInputVarValues = useCallback((newPayload: Record<string, any>) => {
    setRunInputData(newPayload)
  }, [setRunInputData])

  return {
    inputs,
    handleVarListChange,
    handleAddVariable,
    handleCodeChange,
    handleCodeLanguageChange,
    handleVarsChange,
    filterVar,
    handleAddOutputVariable,
    // single run
    isShowSingleRun,
    hideSingleRun,
    runningStatus,
    isCompleted,
    handleRun,
    handleStop,
    varInputs,
    inputVarValues,
    setInputVarValues,
    runResult,
  }
}

export default useConfig